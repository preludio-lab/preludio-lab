import { z } from '@/shared/validation/zod';
import { SlugSchema } from '../shared/common.metadata';
import { WorkId } from '@/shared/id';

/**
 * Work Control
 * 楽曲のシステム制御情報
 */
export const WorkControlSchema = z.object({
  id: z.string().uuid(),
  /** 楽曲スラグ (e.g. "symphony-no5") */
  slug: SlugSchema,
  /** 作曲家スラグ (e.g. "beethoven") */
  composerSlug: SlugSchema,

  updatedAt: z.coerce.date(),
  createdAt: z.coerce.date(),
});

export type WorkControl = Omit<z.infer<typeof WorkControlSchema>, 'id'> & {
  id: WorkId;
};
