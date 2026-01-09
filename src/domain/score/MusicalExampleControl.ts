import { z } from 'zod';

/**
 * 譜例コントロール
 */
export const MusicalExampleControlSchema = z.object({
  /** 譜例ID (UUID v7) */
  id: z.string().min(1).max(50),
  /** 作成日時 */
  createdAt: z.coerce.date(),
  /** 最終更新日時 */
  updatedAt: z.coerce.date(),
});

export type MusicalExampleControl = z.infer<typeof MusicalExampleControlSchema>;

/**
 * 譜例ID
 */
export type MusicalExampleId = string;

/**
 * MusicalExampleControl の生成
 */
export const createMusicalExampleControl = (
  id: string,
  createdAt: Date = new Date(),
  updatedAt: Date = new Date(),
): MusicalExampleControl => {
  return MusicalExampleControlSchema.parse({
    id,
    createdAt,
    updatedAt,
  });
};
