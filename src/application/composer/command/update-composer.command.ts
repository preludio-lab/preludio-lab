import { z } from 'zod';
import { SlugSchema } from '@/domain/shared/common.metadata';
import { ComposerBaseCommandSchema } from './base.command';

/**
 * Update Composer Command
 * 既存作曲家更新用のバリデーションスキーマ。
 * 識別子となる slug 以外は全て任意（Partial）とします。
 */
export const UpdateComposerCommandSchema = ComposerBaseCommandSchema.partial().extend({
  /** 更新対象を特定するために slug は必須 */
  slug: SlugSchema,
});

export type UpdateComposerCommand = z.infer<typeof UpdateComposerCommandSchema>;
