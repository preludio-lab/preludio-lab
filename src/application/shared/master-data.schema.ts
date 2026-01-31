import { z } from 'zod';

/**
 * Common Master Data Metadata
 * 全てのマスタデータJSONに共通する管理用メタデータ定義。
 */

export const MasterSystemMetadataSchema = z.object({
  /** スキーマバージョン (形式: SemVer) */
  _schemaVersion: z.string().optional(),

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
