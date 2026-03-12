import { z } from '@/shared/validation/zod';
import { WorkControlSchema } from '@/domain/work/work.control';
import { WorkMetadataBaseSchema } from '@/domain/work/work.metadata';
import { MusicalIdentitySchema } from '@/domain/work/work.shared';
import { MasterSystemMetadataSchema } from '../../shared/master-data.schema';
import { WorkPartMasterSchema } from './work-part-master.schema';

/** 楽曲マスタースキーマの現在バージョン */
export const WORK_MASTER_VERSION = '1.1.0';

/**
 * Work Master Data Base Schema (without refinement)
 */
export const WorkMasterBaseSchema = WorkControlSchema.pick({
  slug: true,
  composerSlug: true,
})
  .merge(
    WorkMetadataBaseSchema.pick({
      titleComponents: true,
      catalogues: true,
      era: true,
      compositionYear: true,
      compositionPeriod: true,
      instrumentation: true,
      instruments: true,
      instrumentationFlags: true,
      performanceDifficulty: true,
      impressionDimensions: true,
      nicknames: true,
      description: true,
      tags: true,
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
    _schemaVersion: z.string().default(WORK_MASTER_VERSION),
    /** 構成楽曲（楽章）のリスト (Workから分離されたが、旧データや生成時の互換性のために許容) */
    parts: z.array(WorkPartMasterSchema).optional(),
  });

/**
 * Work Master Data Schema (JSON)
 * 楽曲マスタデータ(JSONファイル)の構造定義。
 */
export const WorkMasterSchema = WorkMasterBaseSchema.superRefine((data, ctx) => {
  // isPrimary: true が複数存在しないことを確認
  const primaryCatalogueCount = data.catalogues.filter((c) => c.isPrimary).length;
  if (primaryCatalogueCount > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Primary catalogue must be at most one.',
      path: ['catalogues'],
    });
  }
});

export type WorkMaster = z.infer<typeof WorkMasterSchema>;
