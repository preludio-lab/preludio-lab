import { describe, it, expect } from 'vitest';
import { RecordingControlSchema } from './RecordingControl';

describe('RecordingControl', () => {
  it('有効な制御オブジェクトをバリデーションできること', () => {
    const validData = {
      id: '018b0a1a-2b3c-7d4e-5f6g-7h8i9j0k1l2m',
      workId: '018b0a1a-2b3c-7d4e-5f6g-7h8i9j0k1l2n',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = RecordingControlSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('IDが50文字を超える場合にバリデーションエラーになること', () => {
    const invalidData = {
      id: 'a'.repeat(51),
      workId: 'some-work-id',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = RecordingControlSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });

  it('workIdが50文字を超える場合にバリデーションエラーになること', () => {
    const invalidData = {
      id: 'some-id',
      workId: 'a'.repeat(51),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const result = RecordingControlSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
