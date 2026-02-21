import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { consola } from 'consola';

export interface FetcherConfig {
  /** ベースとなるURL (Optional) */
  baseURL?: string;
  /** リクエストのタイムアウト (msec) デフォルト: 10000 */
  timeout?: number;
  /** 최대リトライ回数 デフォルト: 3 */
  maxRetries?: number;
  /**
   * ドメインごとのプロアクティブなスロットリング（レート制限）。
   * 例えば 1 を指定すると、最大でも1秒に1回しかリクエストを送らないよう待機します。
   */
  requestsPerSecond?: number;
}

/**
 * 外部API通信を一元管理する耐障害性の高いHTTPクライアントラッパー
 */
export class ResilientFetcher {
  private client: AxiosInstance;
  private requestQueue: Array<{ resolve: () => void; reject: (reason?: unknown) => void }> = [];
  private isProcessingQueue = false;
  private minIntervalMs: number;
  private lastRequestTime = 0;

  constructor(config: FetcherConfig = {}) {
    this.minIntervalMs = config.requestsPerSecond ? 1000 / config.requestsPerSecond : 0;

    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      headers: {
        'User-Agent': 'PreludioLabAgent/1.0',
      },
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
   * 必要なインターバルが経過するまでリクエストを待機（キューイング）させる
   */
  private async throttle(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.requestQueue.push({ resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue() {
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
   * 設定済みのAxiosInstanceを取得します
   */
  public getClient(): AxiosInstance {
    return this.client;
  }
}
