import { describe, it, expect } from 'vitest';
import { WorkMetadataSchema, MetronomeUnit } from './WorkMetadata';

describe('WorkMetadataSchema', () => {
  const validMetadata = {
    title: { ja: '交響曲第5番', en: 'Symphony No. 5' },
    catalogue: {
      prefix: 'Op.',
      number: '67',
      sortOrder: 67
    },
  };

  it('should validate valid metadata', () => {
    const result = WorkMetadataSchema.safeParse(validMetadata);
    expect(result.success).toBe(true);
  });

  it('should fail if title is missing', () => {
    const result = WorkMetadataSchema.safeParse({
      catalogue: { number: '67' },
    });
    expect(result.success).toBe(false);
  });

  it('should validate title max length (150)', () => {
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, title: { ja: 'A'.repeat(150) } }).success).toBe(true);
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, title: { ja: 'A'.repeat(151) } }).success).toBe(false);
  });

  it('should validate description max length (2000)', () => {
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, description: { ja: 'A'.repeat(2000) } }).success).toBe(true);
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, description: { ja: 'A'.repeat(2001) } }).success).toBe(false);
  });

  it('should validate performanceDifficulty (1-5)', () => {
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, performanceDifficulty: 1 }).success).toBe(true);
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, performanceDifficulty: 5 }).success).toBe(true);
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, performanceDifficulty: 0 }).success).toBe(false);
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, performanceDifficulty: 6 }).success).toBe(false);
  });

  it('should validate catalogue with complex numbers and sortOrder', () => {
    const result = WorkMetadataSchema.safeParse({
      ...validMetadata,
      catalogue: { prefix: 'K.', number: '331a', sortOrder: 331 }
    });
    expect(result.success).toBe(true);

    // Invalid sortOrder (0)
    expect(WorkMetadataSchema.safeParse({
      ...validMetadata,
      catalogue: { ...validMetadata.catalogue, sortOrder: 0 }
    }).success).toBe(false);

    // Invalid sortOrder (1_000_001)
    expect(WorkMetadataSchema.safeParse({
      ...validMetadata,
      catalogue: { ...validMetadata.catalogue, sortOrder: 1_000_001 }
    }).success).toBe(false);
  });

  it('should validate instrumentation layout', () => {
    const result = WorkMetadataSchema.safeParse({
      ...validMetadata,
      instrumentation: '2.2.2.2 - 4.2.3.1 - tmp - str',
      instrumentationFlags: { isOrchestral: true }
    });
    expect(result.success).toBe(true);
  });

  it('should validate WorkPart order (1-indexed)', () => {
    const partValid = { id: '550e8400-e29b-41d4-a716-446655440001', slug: '1st', order: 1, title: { ja: '1st' } };
    const partInvalid = { id: '550e8400-e29b-41d4-a716-446655440001', slug: '1st', order: 0, title: { ja: '1st' } };

    expect(WorkMetadataSchema.safeParse({ ...validMetadata, parts: [partValid] }).success).toBe(true);
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, parts: [partInvalid] }).success).toBe(false);
  });

  it('should validate nested musical properties', () => {
    const musicalIdentity = {
      key: 'c-minor',
      tempo: 'Allegro con brio',
      tempoTranslation: { ja: '快活に' },
      timeSignature: { numerator: 4, denominator: 4, displayString: 'C' },
      bpm: 120,
      metronomeUnit: MetronomeUnit.QUARTER
    };

    expect(WorkMetadataSchema.safeParse({
      ...validMetadata,
      musicalIdentity
    }).success).toBe(true);
  });
});
