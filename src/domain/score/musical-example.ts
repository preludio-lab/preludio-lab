import { z } from 'zod';
import { MusicalExampleControl, MusicalExampleControlSchema } from './musical-example.control';
import { MusicalExampleMetadata, MusicalExampleMetadataSchema } from './musical-example-metadata';
import { RecordingSegment, RecordingSegmentSchema } from '../recording/recording.segment';

/**
 * MusicalExample (Component/Excerpt)
 * 記事内に埋め込まれる譜例のルートエンティティ。
 */
export const MusicalExampleSchema = z.object({
  control: MusicalExampleControlSchema,
  metadata: MusicalExampleMetadataSchema,
  /** 譜例に関連付けられた録音セグメント (Playback Samples) */
  samples: z.array(RecordingSegmentSchema).default([]),
});

export type MusicalExample = z.infer<typeof MusicalExampleSchema>;
export { type MusicalExampleId } from './musical-example.control';

/**
 * MusicalExample の生成
 */
export const createMusicalExample = (
  control: MusicalExampleControl,
  metadata: MusicalExampleMetadata,
  samples: RecordingSegment[] = [],
): MusicalExample => {
  return MusicalExampleSchema.parse({
    control,
    metadata,
    samples,
  });
};
