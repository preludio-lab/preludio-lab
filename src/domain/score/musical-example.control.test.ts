import { describe, it, expect } from 'vitest';
import { MusicalExampleControlSchema } from './musical-example.control';

describe('MusicalExampleControl', () => {
  it('MusicalExampleControl を作成できること', () => {
    const data = {
      id: '018f3a3a-3a3a-7a3a-a3a3-a3a3a3a3a3a3',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const control = MusicalExampleControlSchema.parse(data);

    expect(control.id).toBe(data.id);
  });
});
