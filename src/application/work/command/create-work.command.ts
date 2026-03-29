import { z } from '@/shared/validation/zod';
import { WorkBaseCommandSchema } from './base.command';
import { SlugSchema } from '@/domain/shared/common.metadata';

/**
 * Create Work Command
 *
 * 作品新規作成用のバリデーションスキーマ。
 * `WorkBaseCommandSchema` を拡張し、作成時に必須となる識別子(`slug`, `composerSlug`)を追加しています。
 * また、構成楽曲(`parts`)の初期リストも定義可能です。
 */
export const CreateWorkCommandSchema = WorkBaseCommandSchema.extend({
  /** 作品のスラグ (URL識別子)。作曲家内で一意である必要があります。 */
  slug: SlugSchema,
  /** 紐付ける作曲家のスラグ */
  composerSlug: SlugSchema,
});

export type CreateWorkCommand = z.infer<typeof CreateWorkCommandSchema>;
