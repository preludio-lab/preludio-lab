import { z } from 'zod';
import { createMultilingualStringSchema } from '../i18n/Locale';

/**
 * Recording Metadata
 * 録音に関する記述的メタデータ
 */
export const RecordingMetadataSchema = z.object({
  /** 演奏者名 (多言語, 最大20文字) */
  performerName: createMultilingualStringSchema({ max: 20 }),
  /** 録音年 (1800年〜2999年) */
  recordingYear: z.number().int().min(1800).max(2999).optional(),
  /** おすすめ音源フラグ */
  isRecommended: z.boolean().default(false),
});

export type RecordingMetadata = z.infer<typeof RecordingMetadataSchema>;
