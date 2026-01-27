import { z } from 'zod';

/**
 * Recording Segment
 * 録音ソースの一部を取り出した（トリミングした）区間。
 * 譜例（MusicalExample）やハイライト再生、イントロ再生などで使用される汎用的な値オブジェクト。
 */
export const RecordingSegmentSchema = z.object({
  /** 録音ソースID (Reference to RecordingSource.id) */
  recordingSourceId: z.string().uuid(),

  /** 再生開始秒数 (0〜86400: 24h) */
  startSeconds: z.number().nonnegative().max(86400),

  /** 再生終了秒数 */
  endSeconds: z.number().nonnegative().max(86400),

  /** デフォルト音源としての優先度フラグ */
  isDefault: z.boolean().default(false),
});

export type RecordingSegment = z.infer<typeof RecordingSegmentSchema>;

/**
 * RecordingSegment の生成
 */
export const createRecordingSegment = (params: RecordingSegment): RecordingSegment => {
  return RecordingSegmentSchema.parse(params);
};
