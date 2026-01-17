import { z } from 'zod';

/**
 * Recording Control
 * 録音の識別子とライフサイクル管理
 */
export const RecordingControlSchema = z.object({
  /** 録音のユニークID (UUID v7) */
  id: z.string().min(1).max(50),
  /** 対象楽曲のID (UUID v7) */
  workId: z.string().min(1).max(50),
  /** 作成日時 */
  createdAt: z.coerce.date(),
  /** 最終更新日時 */
  updatedAt: z.coerce.date(),
});

export type RecordingControl = z.infer<typeof RecordingControlSchema>;
