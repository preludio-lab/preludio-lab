import { z } from 'zod';
import { WorkControlSchema } from './work.control';
import { WorkMetadataSchema } from './work.metadata';
import { MusicalIdentitySchema } from './work.shared';
import { WorkPartDataSchema } from './work-part.schema';

/**
 * Work Data Schema (Master JSON)
 * 楽曲マスタデータの構造定義 (Flat Structure for JSON)。
 *
 * - Control: Slug, ID, Lifecycle
 * - Metadata: Title, Catalogue, Attributes
 * - Identity (Hoisted): Key, Genres
 *
 * ドメイン定義("Single Source of Truth")を再利用しつつ、
 * JSONに必要なフィールドを明示的にPickして定義します。
 */
export const WorkDataSchema = WorkControlSchema.pick({
  slug: true,
  composerSlug: true,
})
  .merge(
    WorkMetadataSchema.pick({
      title: true,
      titleComponents: true,
      catalogue: true, // Nested
      era: true,
      compositionYear: true,
      compositionPeriod: true,
      impressionDimensions: true, // Nested
      nicknames: true,
      tags: true,
      instrumentation: true,
      instrumentationFlags: true,
      performanceDifficulty: true,
      description: true,
    }),
  )
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
  });

export type WorkData = z.infer<typeof WorkDataSchema>;
