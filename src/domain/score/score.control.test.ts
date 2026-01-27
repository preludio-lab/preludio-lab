import { describe, it, expect } from 'vitest';
import { ScoreControlSchema } from './score.control';

describe('ScoreControl', () => {
  it('指定された値で ScoreControl を作成できること', () => {
    const id = '018f3a3a-3a3a-7a3a-a3a3-a3a3a3a3a3a3';
    const now = new Date();
    const data = { id, createdAt: now, updatedAt: now };
    const control = ScoreControlSchema.parse(data);

    expect(control.id).toBe(id);
    expect(control.createdAt).toEqual(now);
    expect(control.updatedAt).toEqual(now);
  });

  it('不正な形式でエラーになること', () => {
    expect(() => ScoreControlSchema.parse({ id: '' })).toThrow();
  });
});
