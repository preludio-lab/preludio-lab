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
      /** AIによる推論結果の自信度 (0.0 - 1.0) */
      confidenceScore: z.coerce.number().min(0).max(1).optional(),
      /** 参考にした情報源のURLリスト (Wikipedia, IMSLP等) */
      sourceRefs: z.array(z.string().url()).max(50).optional(),
      /** CI実行IDやバッチID */
      executionId: z.string().max(100).optional(),
    })
    .optional(),
});
