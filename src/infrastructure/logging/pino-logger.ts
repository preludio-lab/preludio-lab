import pino from 'pino';
import { ILogger } from '@/shared/logging/logger';

/**
 * インフラ層の実装: Pino Logger
 *
 * ILogger の Pino による具体的な実装。
 * 主にサーバーコンポーネントおよびサーバーアクションで使用されます。
 */
export class PinoLogger implements ILogger {
  private logger: pino.Logger;

  constructor() {
    // 設定:
    // - 開発環境: 読みやすさのために Pretty print を使用（Pinoのデフォルト設定に依存）
    // - 本番環境: オブザーバビリティのために JSON 形式
    this.logger = pino({
      level: process.env.LOG_LEVEL || 'info', // デフォルトは info
    });
  }

  debug(message: string, meta?: Record<string, unknown>) {
    this.logger.debug(meta, message);
  }

  info(message: string, meta?: Record<string, unknown>) {
    this.logger.info(meta, message);
  }

  warn(message: string, meta?: Record<string, unknown>) {
    this.logger.warn(meta, message);
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>) {
    // 構造化パースのためにエラーオブジェクトがログオブジェクトにマージされるようにする
    this.logger.error({ ...meta, err: error }, message);
  }
}
