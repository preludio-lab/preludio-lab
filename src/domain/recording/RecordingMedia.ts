import { z } from 'zod';
import { RecordingSourceSchema } from './RecordingSource';

/**
 * Recording Media
 * 録音ソースの集合を管理するモジュール
 */
export const RecordingMediaSchema = z.object({
    /** 録音ソースのリスト (最大50件) */
    sources: z.array(RecordingSourceSchema).max(50).default([]),
});

export type RecordingMedia = z.infer<typeof RecordingMediaSchema>;
