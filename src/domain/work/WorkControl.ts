import { z } from '@/shared/validation/zod';
import { SlugSchema } from '../shared/CommonMetadata';

/**
 * Work Control
 * 作品の属性制御情報 (Identity & Metadata Root)
 * Workは楽曲のマスタデータであるため、公開状態（Status）は持ちません。
 */
export const WorkControlSchema = z.object({
  /** 作品を一意に識別する UUID (v7推奨) */
  id: z.string().uuid(),
  /** 作曲家 ID (Slug) - 作品の同一性を定義する一部 */
  composer: z.string().min(1).max(64),
  /**
   * URLスラグ (作曲家単位で一意)
   * e.g. "symphony-no5"
   */
  slug: SlugSchema,
  /** 作成日時 */
  createdAt: z.coerce.date(),
  /** 更新日時 */
  updatedAt: z.coerce.date(),
});

export type WorkControl = z.infer<typeof WorkControlSchema>;
