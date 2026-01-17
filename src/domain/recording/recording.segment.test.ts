import { describe, it, expect } from 'vitest';
import { RecordingSegmentSchema } from './recording.segment';

describe('RecordingSegment', () => {
  it('正しい RecordingSegment を作成できること', () => {
    const data = {
      recordingSourceId: 'src-1',
      startSeconds: 10,
      endSeconds: 20,
      isDefault: true,
    };
    const segment = RecordingSegmentSchema.parse(data);

    expect(segment.recordingSourceId).toBe('src-1');
    expect(segment.startSeconds).toBe(10);
    expect(segment.endSeconds).toBe(20);
    expect(segment.isDefault).toBe(true);
  });

  // isDefault のデフォルト値テストなどを追加しても良い
  it('isDefault はデフォルトで false であること', () => {
    const data = {
      recordingSourceId: 'src-1',
      startSeconds: 10,
      endSeconds: 20,
    };
    const segment = RecordingSegmentSchema.parse(data);
    expect(segment.isDefault).toBe(false);
  });
});
