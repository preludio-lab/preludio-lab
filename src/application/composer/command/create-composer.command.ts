import { z } from 'zod';
import { ComposerBaseCommandSchema } from './base.command';

/**
 * Create Composer Command
 * 作曲家新規作成用のバリデーションスキーマ。
 */
export const CreateComposerCommandSchema = ComposerBaseCommandSchema.extend({
  /** 作成時は slug が必須 */
  slug: z.string().min(1),
});

export type CreateComposerCommand = z.infer<typeof CreateComposerCommandSchema>;
