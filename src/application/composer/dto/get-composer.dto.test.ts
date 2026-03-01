import { describe, expect, it } from 'vitest';
import { GetComposerDtoSchema } from './get-composer.dto';

describe('GetComposerDtoSchema', () => {
  const validData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    slug: 'beethoven',
    name: 'Ludwig van Beethoven',
    biography: 'German composer.',
    era: 'romantic',
    birthDate: '1770-12-17',
    deathDate: '1827-03-26',
    nationalityCode: 'DE',
    translations: {
      ja: {
        fullName: 'ルートヴィヒ・ヴァン・ベートーヴェン',
        displayName: 'ベートーヴェン',
        shortName: 'Beethoven',
        biography: 'ドイツの作曲家。',
      },
    },
    relatedWorks: [
      {
        id: '1',
        title: 'Symphony No. 5',
        year: 1808,
      },
    ],
    updatedAt: '2024-01-01T00:00:00.000Z',
  };

  it('should parse valid data', () => {
    const result = GetComposerDtoSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should fail if extra fields are introduced (strict mode)', () => {
    const dataWithSecret = {
      ...validData,
      secretField: 'secret-do-not-leak',
    };

    const result = GetComposerDtoSchema.safeParse(dataWithSecret);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue.code).toBe('unrecognized_keys');
      if (issue.code === 'unrecognized_keys') {
        expect(issue.keys).toContain('secretField');
      }
    }
  });

  it('should fail if relatedWorks contains extra fields', () => {
    const dataWithExtraWorksInfo = {
      ...validData,
      relatedWorks: [
        {
          id: '1',
          title: 'Symphony No. 5',
          year: 1808,
          description: 'A famous symphony', // NOT ALLOWED BY UI SCHEMA
        },
      ],
    };

    const result = GetComposerDtoSchema.safeParse(dataWithExtraWorksInfo);
    expect(result.success).toBe(false);
    if (!result.success) {
      const issue = result.error.issues[0];
      expect(issue.code).toBe('unrecognized_keys');
      if (issue.code === 'unrecognized_keys') {
        expect(issue.keys).toContain('description');
      }
    }
  });
});
