import { z } from 'zod';
import { PhraseControl, PhraseControlSchema } from './phrase.control';
import { PhraseMetadata, PhraseMetadataSchema } from './phrase.metadata';
import { RecordingSegment, RecordingSegmentSchema } from '../recording/recording.segment';

/**
 * Phrase (Component/Excerpt)
 * 記事内に埋め込まれるフレーズのルートエンティティ。
 */
export const PhraseSchema = z.object({
  control: PhraseControlSchema,
  metadata: PhraseMetadataSchema,
  /** フレーズに関連付けられた録音セグメント (Playback Samples) */
  samples: z.array(RecordingSegmentSchema).default([]),
});

export type Phrase = z.infer<typeof PhraseSchema>;
export { type PhraseId } from './phrase.control';

/**
 * Phrase の生成
 */
export const createPhrase = (
  control: PhraseControl,
  metadata: PhraseMetadata,
  samples: RecordingSegment[] = [],
): Phrase => {
  return PhraseSchema.parse({
    control,
    metadata,
    samples,
  });
};
