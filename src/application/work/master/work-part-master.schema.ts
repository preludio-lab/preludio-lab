import { z } from 'zod';
import { WorkPartControlSchema } from '@/domain/work/work-part.control';
import { WorkPartMetadataBaseSchema } from '@/domain/work/work-part.metadata';
import { MusicalIdentitySchema } from '@/domain/work/work.shared';

import { SlugSchema } from '@/domain/shared/common.metadata';
import { MasterSystemMetadataSchema } from '../../shared/master-data.schema';

/**
 * Work Part Master Data Schema (Standalone JSON)
 * 楽曲楽章マスタデータ(JSONファイル)の構造定義。
 */
export const WORK_PART_MASTER_VERSION = '1.0.0';

/**
 * Work Part Master Data Base Schema (without refinement)
 */
export const WorkPartMasterBaseSchema = WorkPartControlSchema.pick({
  slug: true,
  order: true,
})
  .merge(
    WorkPartMetadataBaseSchema.pick({
      titleComponents: true,
      catalogues: true,
      type: true,
      isNameStandard: true,
      description: true,
      performanceDifficulty: true,
      impressionDimensions: true,
      nicknames: true,
      tags: true,
      instruments: true,
      basedOn: true,
    }),
  )
  .merge(
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
  .merge(MasterSystemMetadataSchema)
  .extend({
    /** スキーマバージョン (個別管理) */
    _schemaVersion: z.string().default(WORK_PART_MASTER_VERSION),

    /** 作曲家 Slug (コンテキスト保持用) */
    composerSlug: SlugSchema,
    /** 親楽曲 Slug (コンテキスト保持用) */
    workSlug: SlugSchema,
    /** 構成楽曲（楽章）のリスト (Legacy compatibility or recursive structure if needed, but usually empty in standalone) */
    parts: z.array(z.any()).optional(),
  });

/**
 * Work Part Master Data Schema (Nested JSON Item)
 */
export const WorkPartMasterSchema = WorkPartMasterBaseSchema.superRefine((data, ctx) => {
  // isPrimary: true が複数存在しないことを確認
  const primaryCount = data.catalogues.filter((c) => c.isPrimary).length;
  if (primaryCount > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Primary catalogue must be at most one.',
      path: ['catalogues'],
    });
  }
});

export type WorkPartMaster = z.infer<typeof WorkPartMasterSchema>;
