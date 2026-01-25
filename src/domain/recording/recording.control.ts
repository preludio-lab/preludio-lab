import { z } from '@/shared/validation/zod';
import { Id } from '@/shared/id';
import { WorkId } from '../work/work.control';

/**
 * Recording Entity ID
 */
export type RecordingId = Id<'Recording'>;

/**
 * Recording Control
 * 録音の識別子とライフサイクル管理
 */
export const RecordingControlSchema = z.object({
  /** 録音のユニークID (UUID v7) */
  id: z.string().uuid(),
  /** 対象楽曲のID (UUID v7) */
  workId: z.string().uuid(),
  /** 作成日時 */
  createdAt: z.coerce.date(),
  /** 最終更新日時 */
  updatedAt: z.coerce.date(),
});

export type RecordingControl = Omit<z.infer<typeof RecordingControlSchema>, 'id' | 'workId'> & {
  id: RecordingId;
  workId: WorkId;
};
