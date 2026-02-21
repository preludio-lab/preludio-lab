import { createConsola, ConsolaInstance, LogLevel } from 'consola';
import { env } from '@/core/env.js';

/**
 * プロジェクト全体で利用される構造化ロガーのシングルトンインスタンス。
 *
 * 実行環境の環境変数 `LOG_LEVEL` の値に基づいて出力レベルが制御され、
 * コンソール出力時には見やすいフォーマットと色付きでログを記録します。
 * デフォルトで `[ADK]` (Agent Development Kit) というタグが付与されます。
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
