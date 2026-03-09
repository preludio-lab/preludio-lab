import pino, { Logger as PinoInstance } from 'pino';
import * as Sentry from '@sentry/nextjs';
import { Logger } from '@/shared/logging/logger';
import { NODE_ENV } from '@/lib/constants';

/**
 * インフラ層の実装: Pino Logger (Node.js & Edge Runtime Compatible)
 *
 * ILogger の Pino による具体的な実装。
 * サーバーサイド (Node.js) および Edge Runtime (Middleware 等) で使用されます。
 */
export class PinoLogger implements Logger {
  private pino: PinoInstance;

  constructor() {
    const isDevelopment = process.env.NODE_ENV === NODE_ENV.DEVELOPMENT;

    // Pino の初期化設定
    this.pino = pino({
      level: isDevelopment ? 'debug' : 'info',
      // Edge Runtime での動作安定性を考慮し、ブラウザ互換モードを有効化
      // (Edge では thread-stream や transport が使用できないため)
      browser: {
        asObject: true,
      },
      // セキュリティ (Redaction): 機密情報がログに残らないようにマスク
      redact: {
        paths: [
          'password',
          'token',
          'accessToken',
          'refreshToken',
          'email',
          'secret',
          'authorization',
        ],
        remove: true,
      },
      // ログ出力の基本設定
      base: {
        env: process.env.NODE_ENV,
        runtime: process.env.NEXT_RUNTIME || 'unknown',
      },
    });
  }

  private log(level: 'debug' | 'info' | 'warn', message: string, meta?: Record<string, unknown>) {
    this.pino[level]({ ...meta }, message);
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.log('debug', message, meta);
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.pino.warn({ ...meta }, message);
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>) {
    // 構造化ログを出力
    this.pino.error({ ...meta, error: error ? this.formatError(error) : undefined }, message);

    // ガイドライン: ERROR レベルのログ出力時に自動で Sentry.captureException が走る
    // Sentry が初期化されていない場合でも安全に呼び出せる (内部で null check される)
    Sentry.captureException(error || new Error(message), {
      extra: { ...meta, originalMessage: message },
      tags: {
        logger: 'pino',
        runtime: process.env.NEXT_RUNTIME || 'unknown',
      },
    });
  }

  /**
   * エラーオブジェクトをログ出力用にフォーマット
   */
  private formatError(error: Error) {
    return {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...(error as unknown as Record<string, unknown>),
    };
  }
}
