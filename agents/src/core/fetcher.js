import axios from 'axios';
import axiosRetry from 'axios-retry';
import { setupCache, buildStorage } from 'axios-cache-interceptor';
import { consola } from 'consola';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
/**
 * カスタムファイルストレージを作成します。
 * 破損を防ぐための一時ファイル経由のアトミックな書き込み（fs.renameSync）をサポートします。
 */
function createFileStorage(cacheDir) {
  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }
  return buildStorage({
    set: async (key, value) => {
      // url等の情報を元にした安全なファイル名を生成
      const hash = crypto.createHash('sha256').update(key).digest('hex');
      const filePath = path.join(cacheDir, `${hash}.json`);
      const tmpPath = path.join(cacheDir, `${hash}.tmp.json`);
      try {
        fs.writeFileSync(tmpPath, JSON.stringify(value), 'utf8');
        fs.renameSync(tmpPath, filePath); // OSレベルのアトミックな書き込み
      } catch (err) {
        consola.warn(`[Cache Storage] Failed to write cache for key: ${key}`, err);
        // エラー発生時は一時ファイルをクリーンアップ
        if (fs.existsSync(tmpPath)) {
          fs.unlinkSync(tmpPath);
        }
      }
    },
    remove: async (key) => {
      const hash = crypto.createHash('sha256').update(key).digest('hex');
      const filePath = path.join(cacheDir, `${hash}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    },
    get: async (key) => {
      const hash = crypto.createHash('sha256').update(key).digest('hex');
      const filePath = path.join(cacheDir, `${hash}.json`);
      if (fs.existsSync(filePath)) {
        try {
          const data = fs.readFileSync(filePath, 'utf8');
          return JSON.parse(data);
        } catch (err) {
          consola.warn(`[Cache Storage] Failed to read/parse cache for key: ${key}`, err);
          return undefined; // パース失敗時はキャッシュミス扱い
        }
      }
      return undefined;
    },
  });
}
/**
 * 外部 API 通信を一元管理する、耐障害性の高い HTTP クライアントラッパー。
 * 組み込みの自動リトライ機能 (429/5xx対策) と、ドメインごとのプロアクティブなレート制限（スロットリング）の責務を持ちます。
 */
export class ResilientFetcher {
  client;
  requestQueue = [];
  isProcessingQueue = false;
  minIntervalMs;
  lastRequestTime = 0;
  /**
   * ResilientFetcher のインスタンスを生成します。
   *
   * @param config タイムアウト、リトライ回数、スロットリング（秒間リクエスト数）などの設定要件
   */
  constructor(config = {}) {
    this.minIntervalMs = config.requestsPerSecond ? 1000 / config.requestsPerSecond : 0;
    const baseAxios = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      headers: {
        'User-Agent': 'PreludioLabAgent/1.0',
      },
    });
    // キャッシュ保存先ディレクトリ
    const cacheDir = path.resolve(process.cwd(), '.cache', 'fetcher');
    // axios-cache-interceptor を適用
    this.client = setupCache(baseAxios, {
      storage: createFileStorage(cacheDir),
      ttl: config.cacheTTL ?? 1000 * 60 * 60 * 24 * 30, // デフォルト30日
      methods: ['get'], // GETリクエストのみキャッシュ
      cachePredicate: {
        // 200〜299 の成功ステータスのみ保存
        statusCheck: (status) => status >= 200 && status < 300,
      },
      // forceRefresh が true なら、既存キャッシュを無視して強制取得
      ignoreCache: config.forceRefresh === true,
    });
    // 429 や 5xx に対する指数バックオフ付きリトライの設定
    axiosRetry(this.client, {
      retries: config.maxRetries ?? 3,
      retryDelay: axiosRetry.exponentialDelay,
      retryCondition: (error) => {
        // デフォルトのネットワーク/幂等リクエストエラーに加えて 429 Too Many Requests もリトライ対象とする
        return (
          axiosRetry.isNetworkOrIdempotentRequestError(error) || error.response?.status === 429
        );
      },
      onRetry: (retryCount, error, requestConfig) => {
        consola.warn(
          `[ResilientFetcher] Retry attempt #${retryCount} for ${requestConfig.url} due to ${error.message}`,
        );
      },
    });
    // スロットリングのためのリクエストインターセプター
    this.client.interceptors.request.use(async (reqConfig) => {
      if (this.minIntervalMs > 0) {
        await this.throttle();
      }
      return reqConfig;
    });
  }
  /**
   * 必要なインターバルが経過するまで現在のリクエストを待機（キューイング）させます。
   * インターセプターを介して各リクエストの送信前に呼び出されます。
   *
   * @returns リクエストが許可されたタイミングで解決する Promise
   */
  async throttle() {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ resolve, reject });
      this.processQueue();
    });
  }
  /**
   * 待機中のリクエストキューを逐次処理します。
   * 最後にリクエストを送った時間と設定された `minIntervalMs` を比較し、
   * 必要な時間が経過していれば次のリクエストを許可 (resolve) し、そうでなければ待機を続けます。
   */
  async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;
    while (this.requestQueue.length > 0) {
      const now = Date.now();
      const timeSinceLastReq = now - this.lastRequestTime;
      if (timeSinceLastReq >= this.minIntervalMs) {
        // 十分な時間が経過している場合、キューの先頭を実行許可する
        const request = this.requestQueue.shift();
        this.lastRequestTime = Date.now();
        if (request) request.resolve();
      } else {
        // 必要なインターバルを満たすまで待機
        const waitTime = this.minIntervalMs - timeSinceLastReq;
        await new Promise((res) => setTimeout(res, waitTime));
      }
    }
    this.isProcessingQueue = false;
  }
  /**
   * リトライやスロットリング設定が適用済みの Axios インスタンスを取得します。
   * 実際に API リクエストを行う際は、この返り値のインスタンスを使用してください。
   *
   * @returns 構成済みの AxiosInstance オブジェクト
   */
  getClient() {
    return this.client;
  }
}
