import { z } from '@/shared/validation/zod';
import { Id } from '@/shared/id';

/**
 * フレーズコントロール
 */
export const PhraseControlSchema = z.object({
  /** フレーズID (UUID v7) */
  id: z.string().uuid(),
  /** フレーズスラグ (楽曲内一意識別子) */
  slug: z.string().min(1).max(50),
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
  slug: string,
  createdAt: Date = new Date(),
  updatedAt: Date = new Date(),
): PhraseControl => {
  return PhraseControlSchema.parse({
    id: id as PhraseId,
    slug,
    createdAt,
    updatedAt,
  }) as PhraseControl;
};
