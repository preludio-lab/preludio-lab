import { z } from '@/shared/validation/zod';
import { SlugSchema } from '../shared/common-metadata';

/**
 * Composer Control
 * 作曲家の属性制御情報 (Identity & Lifecycle)
 */
export const ComposerControlSchema = z.object({
  /** 作曲家を一意に識別する UUID (v7推奨) */
  id: z.string().uuid(),
  /**
   * URLスラグ (一意)
   * e.g. "bach", "beethoven"
   */
  slug: SlugSchema,
  /** 作成日時 */
  createdAt: z.coerce.date(),
  /** 更新日時 */
  updatedAt: z.coerce.date(),
});

export type ComposerControl = z.infer<typeof ComposerControlSchema>;
