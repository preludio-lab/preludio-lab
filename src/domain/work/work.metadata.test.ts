import { describe, it, expect } from 'vitest';
import { WorkMetadataSchema, MetronomeUnit } from './work.metadata';
import { WorkPartMetadataSchema } from './work-part.metadata';
import { MusicalEra } from '../shared/musical-era';
import { MusicalGenre } from '../shared/musical-genre';
import { MusicalCataloguePrefix } from './musical-catalogue-prefix';
import { MusicalKey, MusicalKeySchema } from './musical-key';

describe('WorkMetadataSchema', () => {
  const validMetadata = {
    titleComponents: {
      title: { ja: '交響曲第5番', en: 'Symphony No. 5' },
    },
    catalogues: [
      {
        prefix: MusicalCataloguePrefix.OP,
        number: '67',
        sortOrder: 67,
      },
    ],
    era: MusicalEra.CLASSICAL,
    musicalIdentity: {
      genres: [MusicalGenre.ORCHESTRAL.SYMPHONY],
    },
  };

  it('should validate valid metadata', () => {
    const result = WorkMetadataSchema.safeParse(validMetadata);
    expect(result.success).toBe(true);
  });

  it('should fail if titleComponents is missing', () => {
    const result = WorkMetadataSchema.safeParse({
      catalogues: [{ number: '67' }],
    });
    expect(result.success).toBe(false);
  });

  it('should validate title max length (150)', () => {
    expect(
      WorkMetadataSchema.safeParse({
        ...validMetadata,
        titleComponents: { title: { ja: 'A'.repeat(150) } },
      }).success,
    ).toBe(true);
    expect(
      WorkMetadataSchema.safeParse({
        ...validMetadata,
        titleComponents: { title: { ja: 'A'.repeat(151) } },
      }).success,
    ).toBe(false);
  });

  it('should validate description max length (2000)', () => {
    expect(
      WorkMetadataSchema.safeParse({ ...validMetadata, description: { ja: 'A'.repeat(2000) } })
        .success,
    ).toBe(true);
    expect(
      WorkMetadataSchema.safeParse({ ...validMetadata, description: { ja: 'A'.repeat(2001) } })
        .success,
    ).toBe(false);
  });

  it('should validate performanceDifficulty (1-5)', () => {
    expect(
      WorkMetadataSchema.safeParse({ ...validMetadata, performanceDifficulty: 1 }).success,
    ).toBe(true);
    expect(
      WorkMetadataSchema.safeParse({ ...validMetadata, performanceDifficulty: 5 }).success,
    ).toBe(true);
    expect(
      WorkMetadataSchema.safeParse({ ...validMetadata, performanceDifficulty: 0 }).success,
    ).toBe(false);
    expect(
      WorkMetadataSchema.safeParse({ ...validMetadata, performanceDifficulty: 6 }).success,
    ).toBe(false);
  });

  it('should validate era (MusicalEra enum)', () => {
    expect(
      WorkMetadataSchema.safeParse({ ...validMetadata, era: MusicalEra.BAROQUE }).success,
    ).toBe(true);
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, era: 'invalid-era' }).success).toBe(
      false,
    );
  });

  it('should validate genres (array of slugs) in musicalIdentity', () => {
    expect(
      WorkMetadataSchema.safeParse({
        ...validMetadata,
        musicalIdentity: { genres: ['symphony', 'sonata'] },
      }).success,
    ).toBe(true);
    expect(
      WorkMetadataSchema.safeParse({
        ...validMetadata,
        musicalIdentity: { genres: 'not-an-array' },
      }).success,
    ).toBe(false);
  });

  it('should validate genres array max limit (20)', () => {
    const manyGenres = Array.from({ length: 21 }, (_, i) => `genre-${i}`);
    const result = WorkMetadataSchema.safeParse({
      ...validMetadata,
      musicalIdentity: { genres: manyGenres },
    });
    expect(result.success).toBe(false);
  });

  it('should validate movement-specific genres directly via WorkPartMetadataSchema', () => {
    const partWithForm = {
      titleComponents: {
        title: { ja: '1st' },
      },
      type: 'movement',
      musicalIdentity: { genres: [MusicalGenre.FORM.SONATA_FORM] },
    };
    const result = WorkPartMetadataSchema.safeParse(partWithForm);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.musicalIdentity?.genres).toContain(MusicalGenre.FORM.SONATA_FORM);
    }
  });

  it('should validate WorkPartMetadataSchema max limits indirectly', () => {
    const partValid = {
      titleComponents: { title: { ja: '1st' } },
      type: 'movement',
    };
    expect(WorkPartMetadataSchema.safeParse(partValid).success).toBe(true);
  });

  it('should validate catalogue with complex numbers and sortOrder', () => {
    const result = WorkMetadataSchema.safeParse({
      ...validMetadata,
      catalogues: [{ prefix: MusicalCataloguePrefix.K, number: '331a', sortOrder: 331 }],
    });
    expect(result.success).toBe(true);

    // Invalid prefix
    expect(
      WorkMetadataSchema.safeParse({
        ...validMetadata,
        catalogues: [{ ...validMetadata.catalogues[0], prefix: 'InvalidPrefix' }],
      }).success,
    ).toBe(false);

    // Invalid sortOrder (-1)
    expect(
      WorkMetadataSchema.safeParse({
        ...validMetadata,
        catalogues: [{ ...validMetadata.catalogues[0], sortOrder: -1 }],
      }).success,
    ).toBe(false);

    // Invalid sortOrder (1_000_001)
    expect(
      WorkMetadataSchema.safeParse({
        ...validMetadata,
        catalogues: [{ ...validMetadata.catalogues[0], sortOrder: 1_000_001 }],
      }).success,
    ).toBe(false);
  });

  it('should validate instrumentation layout', () => {
    const result = WorkMetadataSchema.safeParse({
      ...validMetadata,
      instrumentation: '2.2.2.2 - 4.2.3.1 - tmp - str',
      instrumentationFlags: { isOrchestral: true },
    });
    expect(result.success).toBe(true);
  });

  it('should validate WorkPartMetadata via schema directly', () => {
    const partValid = {
      titleComponents: { title: { ja: '1st' } },
      type: 'movement',
    };
    const partInvalid = {
      titleComponents: { title: { ja: 'A'.repeat(151) } },
      type: 'movement',
    };

    expect(WorkPartMetadataSchema.safeParse(partValid).success).toBe(true);
    expect(WorkPartMetadataSchema.safeParse(partInvalid).success).toBe(false);
  });

  it('should validate nested musical properties', () => {
    const musicalIdentity = {
      key: MusicalKey.C_MINOR,
      genres: [MusicalGenre.ORCHESTRAL.SYMPHONY],
      tempo: 'Allegro con brio',
      tempoTranslation: { ja: '快活に' },
      timeSignature: { numerator: 4, denominator: 4, displayString: 'C' },
      bpm: 120,
      metronomeUnit: MetronomeUnit.QUARTER,
    };

    expect(
      WorkMetadataSchema.safeParse({
        ...validMetadata,
        musicalIdentity,
      }).success,
    ).toBe(true);
  });

  it('should validate atonal and plain keys', () => {
    expect(MusicalKeySchema.safeParse(MusicalKey.ATONAL).success).toBe(true);
    expect(MusicalKeySchema.safeParse(MusicalKey.C).success).toBe(true);
    expect(MusicalKeySchema.safeParse(MusicalKey.F_SHARP).success).toBe(true);
    expect(MusicalKeySchema.safeParse('invalid-key').success).toBe(false);
  });
});
