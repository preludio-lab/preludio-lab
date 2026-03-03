import { describe, expect, it } from 'vitest';
import { GetComposersDtoSchema } from './get-composers.dto';

describe('GetComposersDtoSchema', () => {
  const validData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    slug: 'beethoven',
    name: 'Ludwig van Beethoven',
    era: 'romantic',
    worksCount: 42,
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  it('should parse valid data', () => {
    const result = GetComposersDtoSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should fail if extra fields are introduced (strict mode)', () => {
    const dataWithExtra = {
      ...validData,
      biography: 'Should not leak to list response',
    };

    const result = GetComposersDtoSchema.safeParse(dataWithExtra);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].code).toBe('unrecognized_keys');
    }
  });
});
