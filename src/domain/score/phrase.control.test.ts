import { describe, it, expect } from 'vitest';
import { PhraseControlSchema } from './phrase.control';

describe('PhraseControl', () => {
  it('PhraseControl を作成できること', () => {
    const data = {
      id: '018f3a3a-3a3a-7a3a-a3a3-a3a3a3a3a3a3',
      slug: 'test-slug',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const control = PhraseControlSchema.parse(data);

    expect(control.id).toBe(data.id);
  });
});
