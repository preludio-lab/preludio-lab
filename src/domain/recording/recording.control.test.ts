import { describe, it, expect } from 'vitest';
import { RecordingControlSchema } from './recording.control';

describe('RecordingControl', () => {
  it('有効な制御オブジェクトをバリデーションできること', () => {
    const validData = {
      id: '018f3a3a-3a3a-7a3a-a3a3-a3a3a3a3a3a3',
      workId: '018f3a3a-3a3a-7a3a-a3a3-a3a3a3a3a3a4',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = RecordingControlSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('IDがUUID形式でない場合にバリデーションエラーになること', () => {
    const invalidData = {
      id: 'not-a-uuid',
      workId: '018f3a3a-3a3a-7a3a-a3a3-a3a3a3a3a3a4',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = RecordingControlSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('workIdがUUID形式でない場合にバリデーションエラーになること', () => {
    const invalidData = {
      id: '018f3a3a-3a3a-7a3a-a3a3-a3a3a3a3a3a3',
      workId: 'not-a-uuid',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = RecordingControlSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
