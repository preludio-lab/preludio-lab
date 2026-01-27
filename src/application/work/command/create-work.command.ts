import { z } from 'zod';
import { WorkBaseCommandSchema } from './base.command';
import { WorkPartDataSchema } from '@/domain/work/work-part.schema';
import { WorkControlSchema } from '@/domain/work/work.control';

/**
 * Create Work Command
 *
 * 作品新規作成用のバリデーションスキーマ。
 * `WorkBaseCommandSchema` を拡張し、作成時に必須となる識別子(`slug`, `composerSlug`)を追加しています。
 * また、構成楽曲(`parts`)の初期リストも定義可能です。
 */
export const CreateWorkCommandSchema = WorkBaseCommandSchema.extend({
  /** 作品のスラグ (URL識別子)。作曲家内で一意である必要があります。 */
  slug: WorkControlSchema.shape.slug,
  /** 紐付ける作曲家のスラグ */
  composerSlug: WorkControlSchema.shape.composerSlug,
  /** 構成楽曲（楽章）のリスト */
  parts: z.array(WorkPartDataSchema).default([]),
});

export type CreateWorkCommand = z.infer<typeof CreateWorkCommandSchema>;
