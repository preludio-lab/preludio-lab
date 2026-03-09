/* eslint-disable no-console */
import * as Sentry from '@sentry/nextjs';
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
    // constants.ts の APP_ENV 定数を使用して環境を判定します。
    // クライアントサイドでは process.env.NODE_ENV はビルド時に置換されます。
    this.isDevelopment = process.env.NODE_ENV === APP_ENV.DEVELOPMENT;
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
    // 警告は開発時のみ出力（本番ではノイズ削減のため）
    if (this.isDevelopment) {
      if (meta) {
        console.warn(`[WARN] ${message}`, meta);
      } else {
        console.warn(`[WARN] ${message}`);
      }
    }
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>) {
    // エラーは常に出力 (Sentry 送信用に console.error を使用)
    if (meta || error) {
      console.error(`[ERROR] ${message}`, { ...meta, error });
    } else {
      console.error(`[ERROR] ${message}`);
    }

    // ガイドライン: ERROR レベルのログ出力時に自動で Sentry.captureException が走る
    Sentry.captureException(error || new Error(message), {
      extra: { ...meta, originalMessage: message },
      tags: {
        logger: 'console',
        runtime: 'browser',
      },
    });
  }
}
