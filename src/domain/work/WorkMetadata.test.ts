import { describe, it, expect } from 'vitest';
import { WorkMetadataSchema } from './WorkMetadata';

describe('WorkMetadataSchema', () => {
  const validMetadata = {
    title: { ja: '交響曲第5番', en: 'Symphony No. 5' },
    cataloguePrefix: 'Op.',
    catalogueNumber: 67,
  };

  it('should validate valid metadata', () => {
    const result = WorkMetadataSchema.safeParse(validMetadata);
    expect(result.success).toBe(true);
  });

  it('should fail if title is missing', () => {
    const result = WorkMetadataSchema.safeParse({
      catalogueNumber: 67,
    });
    expect(result.success).toBe(false);
  });

  it('should validate title max length', () => {
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, title: { ja: 'A'.repeat(30) } }).success).toBe(true);
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, title: { ja: 'A'.repeat(31) } }).success).toBe(false);
  });

  it('should validate description max length', () => {
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, description: { ja: 'A'.repeat(200) } }).success).toBe(true);
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, description: { ja: 'A'.repeat(201) } }).success).toBe(false);
  });

  it('should validate compositionPeriod max length', () => {
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, compositionPeriod: { ja: 'A'.repeat(20) } }).success).toBe(true);
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, compositionPeriod: { ja: 'A'.repeat(21) } }).success).toBe(false);
  });

  it('should validate catalogueNumber range', () => {
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, catalogueNumber: 1 }).success).toBe(true);
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, catalogueNumber: 10000 }).success).toBe(true);
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, catalogueNumber: 0 }).success).toBe(false);
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, catalogueNumber: 10001 }).success).toBe(false);
  });

  it('should validate WorkPart order (1-indexed)', () => {
    const partValid = { id: '550e8400-e29b-41d4-a716-446655440001', slug: '1st', order: 1, title: { ja: '1st' } };
    const partInvalid = { id: '550e8400-e29b-41d4-a716-446655440001', slug: '1st', order: 0, title: { ja: '1st' } };

    expect(WorkMetadataSchema.safeParse({ ...validMetadata, parts: [partValid] }).success).toBe(true);
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, parts: [partInvalid] }).success).toBe(false);
  });

  it('should validate string lengths for cataloguePrefix', () => {
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, cataloguePrefix: 'A'.repeat(10) }).success).toBe(true);
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, cataloguePrefix: 'A'.repeat(11) }).success).toBe(false);
  });

  it('should validate string lengths for genre, era', () => {
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, genre: 'A'.repeat(20) }).success).toBe(true);
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, genre: 'A'.repeat(21) }).success).toBe(false);
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, era: 'A'.repeat(20) }).success).toBe(true);
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, era: 'A'.repeat(21) }).success).toBe(false);
  });

  it('should validate musical properties', () => {
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, key: 'c-minor' }).success).toBe(true);
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, tempo: 'A'.repeat(50) }).success).toBe(true);
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, tempo: 'A'.repeat(51) }).success).toBe(false);
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, tempoTranslation: { ja: 'A'.repeat(50) } }).success).toBe(true);
    expect(WorkMetadataSchema.safeParse({ ...validMetadata, tempoTranslation: { ja: 'A'.repeat(51) } }).success).toBe(false);
    expect(WorkMetadataSchema.safeParse({
      ...validMetadata,
      timeSignature: { numerator: 4, denominator: 4 }
    }).success).toBe(true);
  });

  it('should validate nicknames array constraints', () => {
    const result = WorkMetadataSchema.safeParse({
      ...validMetadata,
      nicknames: Array(10).fill('nick'),
    });
    expect(result.success).toBe(true);

    const resultTooMany = WorkMetadataSchema.safeParse({
      ...validMetadata,
      nicknames: Array(11).fill('nick'),
    });
    expect(resultTooMany.success).toBe(false);

    const resultTooLong = WorkMetadataSchema.safeParse({
      ...validMetadata,
      nicknames: ['A'.repeat(31)],
    });
    expect(resultTooLong.success).toBe(false);
  });

  it('should validate tags constraints', () => {
    const resultTooLong = WorkMetadataSchema.safeParse({
      ...validMetadata,
      tags: ['A'.repeat(21)],
    });
    expect(resultTooLong.success).toBe(false);
  });
});
