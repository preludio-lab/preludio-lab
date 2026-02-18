import { Logger } from '@/shared/logging/logger';
import { APP_ENV } from '@/lib/constants';

/**
 * インフラ層の実装: Console Logger
 *
 * ILogger の Console API による具体的な実装。
 * クライアントコンポーネントで使用されます。
 */
export class ConsoleLogger implements Logger {
  private isDevelopment: boolean;

  constructor() {
    // クライアントサイドでの環境判定
    // next.config.ts での置換を期待して process.env.NODE_ENV を直接比較する実装にする場合もあるが、
    // ここでは constants.ts の APP_ENV (実体は文字列) と比較する形をとる。
    // クライアントサイドでは process.env.NODE_ENV は文字列に置換されるためこれで機能する。
    this.isDevelopment = process.env.NODE_ENV === 'development';
  }

  debug(message: string, meta?: Record<string, unknown>) {
    if (this.isDevelopment) {
      if (meta) {
        console.debug(`[DEBUG] ${message}`, meta);
      } else {
        console.debug(`[DEBUG] ${message}`);
      }
    }
  }

  info(message: string, meta?: Record<string, unknown>) {
    if (this.isDevelopment) {
      if (meta) {
        console.info(`[INFO] ${message}`, meta);
      } else {
        console.info(`[INFO] ${message}`);
      }
    }
  }

  warn(message: string, meta?: Record<string, unknown>) {
    // Warnは本番でも出す場合が多いが、ノイズになるなら開発のみにする
    if (meta) {
      console.warn(`[WARN] ${message}`, meta);
    } else {
      console.warn(`[WARN] ${message}`);
    }
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>) {
    // Errorは常に出力
    if (meta || error) {
      console.error(`[ERROR] ${message}`, { ...meta, error });
    } else {
      console.error(`[ERROR] ${message}`);
    }
  }
}
