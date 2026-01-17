import { describe, it, expect } from 'vitest';
import { RecordingMetadataSchema } from './recording.metadata';

describe('RecordingMetadata', () => {
  it('有効なメタデータをバリデーションできること', () => {
    const validData = {
      performerName: { en: 'Glenn Gould', ja: 'グレン・グールド' },
      recordingYear: 1981,
      isRecommended: true,
    };
    const result = RecordingMetadataSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('録音年が1000年未満の場合にバリデーションエラーになること', () => {
    const invalidData = {
      performerName: { en: 'Too Early' },
      recordingYear: 999,
      isRecommended: false,
    };
    const result = RecordingMetadataSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('録音年が2999年を超える場合にバリデーションエラーになること', () => {
    const invalidData = {
      performerName: { en: 'Future' },
      recordingYear: 3000,
      isRecommended: false,
    };
    const result = RecordingMetadataSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
