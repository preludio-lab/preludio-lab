import { z } from 'zod';
import { WorkControlSchema } from './work.control';
import { WorkMetadataBaseSchema } from './work.metadata';
import { MusicalIdentitySchema } from './work.shared';
import { WorkPartDataSchema } from './work-part.schema';

/**
 * Work Data Schema (Master JSON)
 * 楽曲マスタデータの構造定義 (Flat Structure for JSON)。
 *
 * - Control: Slug, ID, Lifecycle
 * - Metadata: Title, Catalogue, Attributes
 * - Identity (Hoisted): Key, Genres
 * - System: Versioning, Provenance
 *
 * ドメイン定義("Single Source of Truth")を再利用しつつ、
 * JSONに必要なフィールドを明示的にPickして定義します。
 */

/** スキーマのバージョン (SemVer) */
export const WORK_DATA_SCHEMA_VERSION = '1.1.0';

/**
 * システム管理用メタデータ
 */
export const WorkSystemMetadataSchema = z.object({
  /** スキーマバージョン */
  _schemaVersion: z.literal(WORK_DATA_SCHEMA_VERSION).default(WORK_DATA_SCHEMA_VERSION),

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

export const WorkDataSchema = WorkControlSchema.pick({
  slug: true,
  composerSlug: true,
})
  .merge(
    WorkMetadataBaseSchema.pick({
      titleComponents: true,
      catalogues: true, // Array of Catalogue
      era: true,
      compositionYear: true,
      compositionPeriod: true,
      impressionDimensions: true,
      nicknames: true,
      tags: true,
      instrumentation: true,
      instrumentationFlags: true,
      performanceDifficulty: true,
      description: true,
      basedOn: true,
    }),
  )
  .merge(WorkSystemMetadataSchema)
  .merge(
    // MusicalIdentityから特定のフィールドをフラットなプロパティとして採用
    MusicalIdentitySchema.pick({
      genres: true,
      key: true,
      tempo: true,
      tempoTranslation: true,
      timeSignature: true,
      bpm: true,
      metronomeUnit: true,
    }),
  )
  .extend({
    /**
     * 構成楽曲（楽章）リスト
     * Aggregateとして一緒に管理します。
     */
    parts: z.array(WorkPartDataSchema).default([]),
  })
  .superRefine((data, ctx) => {
    // isPrimary: true が複数存在しないことを確認 (WorkMetadataSchemaと同じバリデーションを適用)
    const primaryCount = data.catalogues.filter((c) => c.isPrimary).length;
    if (primaryCount > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Primary catalogue must be at most one.',
        path: ['catalogues'],
      });
    }
  });

export type WorkData = z.infer<typeof WorkDataSchema>;
