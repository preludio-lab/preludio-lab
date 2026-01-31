import { z } from 'zod';

/**
 * Common Master Data Metadata
 * 全てのマスタデータJSONに共通する管理用メタデータ定義。
 */

/** スキーマのバージョン (共通) */
export const MASTER_DATA_SCHEMA_VERSION = '1.1.0';

/**
 * システム管理用メタデータスキーマ
 */
export const MasterSystemMetadataSchema = z.object({
  /** スキーマバージョン */
  _schemaVersion: z.literal(MASTER_DATA_SCHEMA_VERSION).default(MASTER_DATA_SCHEMA_VERSION),

  /** 生成時のトレーサビリティ情報 */
  _generatorMeta: z
    .object({
      /** 使用したAIモデル (e.g. "gemini-3-flash-preview") */
      model: z.string().max(50),
      /** 生成日時 (ISO 8601) */
      generatedAt: z.string().datetime(),
      /** プロンプトのバージョンやGitハッシュ */
      promptVersion: z.string().max(100).optional(),
      /** CI実行IDやバッチID */
      executionId: z.string().max(100).optional(),
    })
    .optional(),
});
