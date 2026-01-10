import { describe, it, expect } from 'vitest';
import { ArticleContextSchema } from './ArticleContext';
import { ArticleCategory } from './ArticleMetadata';

describe('ArticleContextSchema', () => {
  it('should allow empty context lists by default', () => {
    const result = ArticleContextSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.seriesAssignments).toEqual([]);
      expect(result.data.relatedArticles).toEqual([]);
    }
  });

  it('should fail if series order is too high', () => {
    const result = ArticleContextSchema.safeParse({
      seriesAssignments: [
        {
          seriesId: 'uuid',
          seriesSlug: 'slug',
          seriesTitle: 'Title',
          order: 10000,
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('should fail if related article title is too long', () => {
    const result = ArticleContextSchema.safeParse({
      relatedArticles: [
        {
          articleId: 'id',
          title: 'a'.repeat(51),
          category: ArticleCategory.WORKS,
          slug: 'slug',
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('should fail if there are too many related articles', () => {
    const tooManyArticles = Array(21).fill({
      articleId: 'id',
      title: 'Title',
      category: ArticleCategory.WORKS,
      slug: 'slug',
    });
    const result = ArticleContextSchema.safeParse({
      relatedArticles: tooManyArticles,
    });
    expect(result.success).toBe(false);
  });

  describe('monetizationElements', () => {
    it('should validate correctly with valid elements', () => {
      const result = ArticleContextSchema.safeParse({
        monetizationElements: [
          {
            type: 'affiliate',
            category: 'score_physical',
            title: { ja: '交響曲第5番 楽譜', en: 'Symphony No.5 Score' },
            url: 'https://amazon.co.jp/dp/example',
            provider: 'amazon',
            action: 'buy',
            priceHint: '¥3,500',
          },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('should fail if title is not multilingual', () => {
      const result = ArticleContextSchema.safeParse({
        monetizationElements: [
          {
            type: 'affiliate',
            category: 'score_physical',
            title: 'Symphony No.5 Score', // Should be an object
            url: 'https://amazon.co.jp/dp/example',
            action: 'buy',
          },
        ],
      });
      expect(result.success).toBe(false);
    });

    it('should fail with invalid action', () => {
      const result = ArticleContextSchema.safeParse({
        monetizationElements: [
          {
            type: 'affiliate',
            category: 'score_physical',
            title: { ja: 'Title' },
            url: 'https://amazon.co.jp/dp/example',
            action: 'invalid_action',
          },
        ],
      });
      expect(result.success).toBe(false);
    });
  });
});
