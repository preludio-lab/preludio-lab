import { z } from '@/shared/validation/zod';
import { SlugSchema } from '../shared/common.metadata';

/**
 * Work Part Control
 * 楽章・構成楽曲の識別および制御情報
 */
export const WorkPartControlSchema = z.object({
  /** 楽章を一意に識別する UUID */
  id: z.string().uuid(),
  /** 親楽曲の ID (UUID) */
  workId: z.string().uuid(),
  /**
   * URLスラグ (作品内で一意)
   * e.g. "1st-mov"
   */
  slug: SlugSchema,
  /**
   * 表示順 (1, 2, 3...)
   * 小数点（3.1等）を許容し、挿入を容易にする。
   */
  order: z.number().min(0.1).max(100),
  /** 作成日時 */
  createdAt: z.coerce.date(),
  /** 更新日時 */
  updatedAt: z.coerce.date(),
});

export type WorkPartControl = z.infer<typeof WorkPartControlSchema>;
