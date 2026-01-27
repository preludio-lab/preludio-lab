import { z } from 'zod';
import { WorkBaseCommandSchema } from './base.command';
import { WorkPartDataSchema } from '@/domain/work/work-part.schema';
import { WorkControlSchema } from '@/domain/work/work.control';

/**
 * Update Work Command
 *
 * 作品更新用のバリデーションスキーマ。
 * `WorkBaseCommandSchema` を `Partial` (全て任意) にした上で、
 * 更新対象を特定するための識別子(`slug`, `composerSlug`)を必須として再定義しています。
 * `parts` が指定された場合、既存のパーツは全て削除され、指定内容で置換されます。
 */
export const UpdateWorkCommandSchema = WorkBaseCommandSchema.partial().extend({
  /** 更新対象作品のスラグ */
  slug: WorkControlSchema.shape.slug,
  /** 更新対象作品の作曲家スラグ */
  composerSlug: WorkControlSchema.shape.composerSlug,
  /** 構成楽曲（楽章）のリスト。指定された場合、既存のリストをこの内容で全置換します。省略時は更新しません。 */
  parts: z.array(WorkPartDataSchema).optional(),
});

export type UpdateWorkCommand = z.infer<typeof UpdateWorkCommandSchema>;
