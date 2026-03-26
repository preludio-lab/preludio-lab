import { z } from 'zod';
import { WorkMetadataBaseSchema } from '@/domain/work/work.metadata';
import { MusicalIdentitySchema } from '@/domain/work/work.shared';
import { WorkControlSchema } from '@/domain/work/work.control';
import { MasterSystemMetadataSchema } from '../../shared/master-data.schema';
import { WorkPartMasterSchema } from './work-part-master.schema';

/** 楽曲マスタースキーマの現在バージョン */
export const WORK_MASTER_VERSION = '1.1.0';

/**
 * Work Master Data Schema (JSON)
 * 楽曲マスタデータ(JSONファイル)の構造定義。
 *
 * Domain層の Metadata および Control スキーマをベースに、
 * マスタ管理用のシステムメタデータを付与して定義します。
 */
export const WorkMasterSchema = WorkMetadataBaseSchema.merge(
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
  .merge(WorkControlSchema.pick({ slug: true, composerSlug: true }))
  .merge(MasterSystemMetadataSchema)
  .extend({
    /** スキーマバージョン (個別管理) */
    _schemaVersion: z.string().default(WORK_MASTER_VERSION),
    // partsをWorkPartMasterSchemaの配列として再定義 (バリデーション強化のため)
    parts: z.array(WorkPartMasterSchema).default([]),
  })
  .superRefine((data, ctx) => {
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

export type WorkMaster = z.infer<typeof WorkMasterSchema>;
