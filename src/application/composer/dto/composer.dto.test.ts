import { describe, expect, it } from 'vitest';
import { ComposerDtoSchema } from './composer.dto';

describe('ComposerDtoSchema', () => {
  const validData = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    slug: 'beethoven',
    name: 'Ludwig van Beethoven',
    biography: 'German composer.',
    era: 'early-romantic',
    birthDate: new Date('1770-12-17T00:00:00.000Z'),
    deathDate: new Date('1827-03-26T00:00:00.000Z'),
    nationalityCode: 'DE',
    portrait: null,
    representativeInstruments: ['piano'],
    representativeGenres: ['symphony', 'sonata'],
    places: [
      { slug: 'vienna', type: 'activity', countryCode: 'AT' },
      { slug: 'bonn', type: 'birth', countryCode: 'DE' },
    ],
    tags: ['classicist'],
    impressionDimensions: {
      innovation: 6,
      emotionality: 10,
      nationalism: -6,
      scale: 8,
      complexity: 4,
      theatricality: 2,
    },
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
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  };

  it('should parse valid data', () => {
    const result = ComposerDtoSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('should fail if extra fields are introduced (strict mode)', () => {
    const dataWithSecret = {
      ...validData,
      secretField: 'secret-do-not-leak',
    };

    const result = ComposerDtoSchema.safeParse(dataWithSecret);
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

    const result = ComposerDtoSchema.safeParse(dataWithExtraWorksInfo);
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
