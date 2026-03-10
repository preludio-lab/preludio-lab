import { consola, ConsolaInstance } from 'consola';
import { Logger } from '@/shared/logging/logger';
import { APP_ENV } from '@/lib/constants';

/**
 * インフラ層の実装: CLI Logger
 *
 * ILogger の consola による具体的な実装。
 * スクリプト、CLI ツール等の Node.js 環境で使用されます。
 */
export class CliLogger implements Logger {
  private consola: ConsolaInstance;

  constructor() {
    const isDevelopment = process.env.NODE_ENV === APP_ENV.DEVELOPMENT;

    // consola の初期化
    this.consola = consola.create({
      level: isDevelopment ? 4 : 3, // 4: debug, 3: info
      // カスタムロガーレベルや特定の設定をここに追加できます
    });
  }

  debug(message: string, meta?: Record<string, unknown>) {
    if (meta) {
      this.consola.debug(message, meta);
    } else {
      this.consola.debug(message);
    }
  }

  info(message: string, meta?: Record<string, unknown>) {
    if (meta) {
      this.consola.info(message, meta);
    } else {
      this.consola.info(message);
    }
  }

  warn(message: string, meta?: Record<string, unknown>) {
    if (meta) {
      this.consola.warn(message, meta);
    } else {
      this.consola.warn(message);
    }
  }

  error(message: string, error?: Error, meta?: Record<string, unknown>) {
    if (meta || error) {
      this.consola.error(message, { ...meta, error });
    } else {
      this.consola.error(message);
    }
  }
}

export const cliLogger = new CliLogger();
