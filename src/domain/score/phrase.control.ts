import { z } from '@/shared/validation/zod';
import { Id } from '@/shared/id';

/**
 * フレーズコントロール
 */
export const PhraseControlSchema = z.object({
  /** フレーズID (UUID v7) */
  id: z.string().uuid(),
  /** 作成日時 */
  createdAt: z.coerce.date(),
  /** 最終更新日時 */
  updatedAt: z.coerce.date(),
});

export type PhraseControl = Omit<z.infer<typeof PhraseControlSchema>, 'id'> & {
  id: PhraseId;
};

/**
 * フレーズID
 */
export type PhraseId = Id<'Phrase'>;

/**
 * PhraseControl の生成
 */
export const createPhraseControl = (
  id: string,
  createdAt: Date = new Date(),
  updatedAt: Date = new Date(),
): PhraseControl => {
  return PhraseControlSchema.parse({
    id: id as PhraseId,
    createdAt,
    updatedAt,
  }) as PhraseControl;
};
