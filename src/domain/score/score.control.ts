import { z } from '@/shared/validation/zod';
import { Id } from '@/shared/id';

/**
 * Score Entity ID
 */
export type ScoreId = Id<'Score'>;

/**
 * ScoreControl
 * 楽譜エディションの制御情報。
 * IDとライフサイクル情報を管理。
 * glossary: ScoreControl に対応
 */
export const ScoreControlSchema = z.object({
  /** 楽譜のユニークID (UUID v7) */
  id: z.string().uuid(),
  /** 作成日時 */
  createdAt: z.coerce.date(),
  /** 最終更新日時 */
  updatedAt: z.coerce.date(),
});

export type ScoreControl = Omit<z.infer<typeof ScoreControlSchema>, 'id'> & {
  id: ScoreId;
};
