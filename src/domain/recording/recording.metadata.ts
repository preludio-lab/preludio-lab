import { z } from 'zod';
import { createMultilingualStringSchema } from '../i18n/locale';
import { YearSchema } from '../shared/common.metadata';

/**
 * Recording Metadata
 * 録音に関する記述的メタデータ
 */
export const RecordingMetadataSchema = z.object({
  /** 演奏者名 (多言語, 最大20文字) */
  performerName: createMultilingualStringSchema({ max: 20 }),
  /** 録音年 (1000年〜2999年) */
  recordingYear: YearSchema.optional(),
  /** おすすめ音源フラグ */
  isRecommended: z.boolean().default(false),
});

export type RecordingMetadata = z.infer<typeof RecordingMetadataSchema>;
