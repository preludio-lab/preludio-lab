import { describe, it, expect } from 'vitest';
import { ArticleMetadataSchema, ArticleCategory } from './ArticleMetadata';

describe('ArticleMetadataSchema', () => {
  const validMetadata = {
    title: 'Test Title',
    displayTitle: 'Display Title',
    slug: 'test-slug',
    category: ArticleCategory.WORKS,
    composerName: 'Beethoven',
    readingLevel: 3,
    performanceDifficulty: 3,
    isFeatured: false,
    readingTimeSeconds: 120,
    tags: ['classic', 'piano'],
    publishedAt: new Date(),
  };

  it('should validate correct metadata', () => {
    const result = ArticleMetadataSchema.safeParse(validMetadata);
    expect(result.success).toBe(true);
  });

  it('should fail if readingLevel is out of range', () => {
    const result = ArticleMetadataSchema.safeParse({
      ...validMetadata,
      readingLevel: 6,
    });
    expect(result.success).toBe(false);
  });

  it('should fail if performanceDifficulty is below 1', () => {
    const result = ArticleMetadataSchema.safeParse({
      ...validMetadata,
      performanceDifficulty: 0,
    });
    expect(result.success).toBe(false);
  });

  it('should fail if slug contains invalid characters', () => {
    const result = ArticleMetadataSchema.safeParse({
      ...validMetadata,
      slug: 'Test_Slug_123', // Upper case and underscore
    });
    expect(result.success).toBe(false);
  });

  it('should fail if title is too long', () => {
    const result = ArticleMetadataSchema.safeParse({
      ...validMetadata,
      title: 'a'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it('should allow hierarchical slugs with slashes', () => {
    const result = ArticleMetadataSchema.safeParse({
      ...validMetadata,
      slug: 'beethoven/symphony-no5',
    });
    expect(result.success).toBe(true);
  });

  it('should fail if slug has leading or trailing slashes', () => {
    expect(ArticleMetadataSchema.safeParse({ ...validMetadata, slug: '/a' }).success).toBe(false);
    expect(ArticleMetadataSchema.safeParse({ ...validMetadata, slug: 'a/' }).success).toBe(false);
    expect(ArticleMetadataSchema.safeParse({ ...validMetadata, slug: 'a//b' }).success).toBe(false);
  });

  it('should fail if slug is longer than 64 characters', () => {
    const result = ArticleMetadataSchema.safeParse({
      ...validMetadata,
      slug: 'a'.repeat(65),
    });
    expect(result.success).toBe(false);
  });

  it('should fail if compositionYear is out of range', () => {
    const result = ArticleMetadataSchema.safeParse({
      ...validMetadata,
      compositionYear: 999,
    });
    expect(result.success).toBe(false);
  });

  it('should fail if readingTimeSeconds exceeds 1800', () => {
    const result = ArticleMetadataSchema.safeParse({
      ...validMetadata,
      readingTimeSeconds: 1801,
    });
    expect(result.success).toBe(false);
  });
});
