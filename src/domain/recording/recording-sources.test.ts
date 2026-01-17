import { describe, it, expect } from 'vitest';
import {
  RecordingSourcesSchema,
  RecordingProvider,
  RecordingAudioQuality,
} from './recording-sources';

describe('RecordingSources', () => {
  // 正常なソースのサンプルデータ
  const validSource = {
    id: 'source-1',
    provider: RecordingProvider.YOUTUBE,
    sourceId: 'dQw4w9WgXcQ',
    quality: RecordingAudioQuality.HIGH,
  };

  it('有効なソースリストをバリデーションできること', () => {
    const validData = {
      items: [validSource],
    };
    const result = RecordingSourcesSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('ソースが50件を超える場合にバリデーションエラーになること', () => {
    const items = Array(51).fill(validSource);
    const invalidData = { items };
    const result = RecordingSourcesSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('空のリストも有効として受け入れること', () => {
    const validData = { items: [] };
    const result = RecordingSourcesSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('ローカルファイルプロバイダを含む異なるプロバイダを検証できること', () => {
    const localSource = {
      id: 'source-local',
      provider: RecordingProvider.LOCAL_FILE,
      sourceId: 'path/to/audio.wav',
      quality: RecordingAudioQuality.PREMIUM,
    };
    const result = RecordingSourcesSchema.safeParse({ items: [localSource] });
    expect(result.success).toBe(true);
  });
});
