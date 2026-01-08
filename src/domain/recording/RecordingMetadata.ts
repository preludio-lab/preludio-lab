import { z } from 'zod';
import { MultilingualStringSchema } from '../i18n/MultilingualString';


/**
 * Recording Metadata
 * 録音に関する記述的メタデータ
 */
export const RecordingMetadataSchema = z.object({
  /** 演奏者名 (多言語) */
  performerName: MultilingualStringSchema,
  /** 録音年 (1800年〜2999年) */
  recordingYear: z.number().int().min(1800).max(2999).optional(),
  /** おすすめ音源フラグ */
  isRecommended: z.boolean().default(false),
});

export type RecordingMetadata = z.infer<typeof RecordingMetadataSchema>;
