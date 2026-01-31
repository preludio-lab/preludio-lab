import { z } from 'zod';
import { CreateWorkCommandSchema } from '../command/create-work.command';
import { MasterSystemMetadataSchema } from '../../shared/master-data.schema';
import { WorkPartMasterSchema } from './work-part-master.schema';

/** 楽曲マスタースキーマの現在バージョン */
export const WORK_MASTER_VERSION = '1.1.0';

/**
 * Work Master Data Schema (JSON)
 * 楽曲マスタデータ(JSONファイル)の構造定義。
 *
 * Approach B: アプリケーション層の CreateWorkCommand をベースに、
 * マスタ管理用のシステムメタデータを付与して定義します。
 */
export const WorkMasterSchema = CreateWorkCommandSchema.merge(MasterSystemMetadataSchema)
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
