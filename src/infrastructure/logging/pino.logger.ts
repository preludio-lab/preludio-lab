import { Logger } from '@/shared/logging/logger';

/**
 * インフラ層の実装: Basic Logger (Edge Compatible)
 *
 * TODO: Pino の Edge Runtime 対応設定が完了したら元に戻す。
 * 現時点では Middleware (Edge) での動作安定性を優先し console を使用する。
 */
export class PinoLogger implements Logger {
  debug(message: string, meta?: Record<string, unknown>) {
    console.debug(`[DEBUG] ${message}`, meta || '');
  }

  info(message: string, meta?: Record<string, unknown>) {
    console.info(`[INFO] ${message}`, meta || '');
  }

  warn(message: string, meta?: Record<string, unknown>) {
    console.warn(`[WARN] ${message}`, meta || '');
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>) {
    console.error(`[ERROR] ${message}`, error || '', meta || '');
  }
}
