import { describe, it, expect } from 'vitest';
import { ArticleControlSchema, ArticleStatus } from './article.control';

describe('ArticleControlSchema', () => {
  it('should validate correct control data', () => {
    const result = ArticleControlSchema.safeParse({
      id: '018f3a3a-3a3a-7a3a-a3a3-a3a3a3a3a3a3',
      lang: 'ja',
      status: ArticleStatus.PUBLISHED,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(result.success).toBe(true);
  });

  it('should fail on invalid status', () => {
    const result = ArticleControlSchema.safeParse({
      id: '018f3a3a-3a3a-7a3a-a3a3-a3a3a3a3a3a3',
      lang: 'ja',
      status: 'INVALID_STATUS',
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(result.success).toBe(false);
  });

  it('should fail if id is not a UUID', () => {
    const result = ArticleControlSchema.safeParse({
      id: 'not-a-uuid',
      lang: 'ja',
      status: ArticleStatus.PUBLISHED,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(result.success).toBe(false);
  });

  it('should fail if lang is too long', () => {
    const result = ArticleControlSchema.safeParse({
      id: '018f3a3a-3a3a-7a3a-a3a3-a3a3a3a3a3a3',
      lang: 'too-long-lang-code',
      status: ArticleStatus.PUBLISHED,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    expect(result.success).toBe(false);
  });
});
