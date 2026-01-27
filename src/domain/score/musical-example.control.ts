import { z } from '@/shared/validation/zod';
import { Id } from '@/shared/id';

/**
 * 譜例コントロール
 */
export const MusicalExampleControlSchema = z.object({
  /** 譜例ID (UUID v7) */
  id: z.string().uuid(),
  /** 作成日時 */
  createdAt: z.coerce.date(),
  /** 最終更新日時 */
  updatedAt: z.coerce.date(),
});

export type MusicalExampleControl = Omit<z.infer<typeof MusicalExampleControlSchema>, 'id'> & {
  id: MusicalExampleId;
};

/**
 * 譜例ID
 */
export type MusicalExampleId = Id<'MusicalExample'>;

/**
 * MusicalExampleControl の生成
 */
export const createMusicalExampleControl = (
  id: string,
  createdAt: Date = new Date(),
  updatedAt: Date = new Date(),
): MusicalExampleControl => {
  return MusicalExampleControlSchema.parse({
    id: id as MusicalExampleId,
    createdAt,
    updatedAt,
  }) as MusicalExampleControl;
};
