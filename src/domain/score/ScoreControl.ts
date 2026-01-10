import { z } from 'zod';

/**
 * ScoreControl
 * 楽譜エディションの制御情報。
 * IDとライフサイクル情報を管理。
 * glossary: ScoreControl に対応
 */
export const ScoreControlSchema = z.object({
  /** 楽譜のユニークID (UUID v7) */
  id: z.string().min(1).max(50),
  /** 作成日時 */
  createdAt: z.coerce.date(),
  /** 最終更新日時 */
  updatedAt: z.coerce.date(),
});

export type ScoreControl = z.infer<typeof ScoreControlSchema>;
