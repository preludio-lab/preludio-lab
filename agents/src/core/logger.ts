import { createConsola, ConsolaInstance, LogLevel } from 'consola';
import { env } from '@/core/env.js';

/**
 * 構造化ロガーインスタンス
 * 環境変数 LOG_LEVEL に基づいて設定されます。
 * タグ "ADK" がデフォルトで付与されます。
 */
export const logger: ConsolaInstance = createConsola({
  level: env.LOG_LEVEL as LogLevel,
  defaults: {
    tag: 'ADK',
  },
  formatOptions: {
    date: true,
    colors: true,
    compact: false,
  },
});
