import { describe, it, expect } from 'vitest';
import { Article } from './Article';
import { ArticleContent } from './ArticleContent';
import { ArticleStatus } from './ArticleControl';
import { ArticleCategory } from './ArticleMetadata';
import { INITIAL_ENGAGEMENT_METRICS } from './ArticleEngagement';

describe('Article Entity', () => {
  const createBaseArticle = (overrides: any = {}) => {
    const now = new Date();
    return new Article({
      control: {
        id: 'test-id',
        lang: 'ja' as any,
        status: ArticleStatus.PUBLISHED,
        createdAt: now,
        updatedAt: now,
        ...overrides.control,
      },
      metadata: {
        title: 'Test Title',
        displayTitle: 'Test Display Title',
        slug: 'test-slug',
        category: ArticleCategory.WORKS,
        composerName: 'Test Composer',
        publishedAt: new Date('2024-01-01T00:00:00Z'),
        tags: [],
        ...overrides.metadata,
      },
      content: new ArticleContent({
        body: 'Test Body',
        structure: [],
        ...overrides.content,
      }),
      engagement: {
        metrics: INITIAL_ENGAGEMENT_METRICS,
        ...overrides.engagement,
      },
      context: {
        seriesAssignments: [],
        relatedArticles: [],
        sourceAttributions: [],
        monetizationElements: [],
        ...overrides.context,
      },
    });
  };

  describe('isPubliclyVisible', () => {
    it('should return true if status is PUBLISHED and publishedAt is in the past', () => {
      const now = new Date('2024-01-02T00:00:00Z');
      const article = createBaseArticle({
        metadata: { publishedAt: new Date('2024-01-01T00:00:00Z') },
      });
      expect(article.isPubliclyVisible(now)).toBe(true);
    });

    it('should return false if status is PUBLISHED but publishedAt is in the future', () => {
      const now = new Date('2024-01-01T00:00:00Z');
      const article = createBaseArticle({
        metadata: { publishedAt: new Date('2024-01-02T00:00:00Z') },
      });
      expect(article.isPubliclyVisible(now)).toBe(false);
    });

    it('should return false if status is DRAFT regardless of publishedAt', () => {
      const now = new Date('2024-01-02T00:00:00Z');
      const article = createBaseArticle({
        control: { status: ArticleStatus.DRAFT },
        metadata: { publishedAt: new Date('2024-01-01T00:00:00Z') },
      });
      expect(article.isPubliclyVisible(now)).toBe(false);
    });

    it('should return false if publishedAt is null', () => {
      const now = new Date();
      const article = createBaseArticle({
        metadata: { publishedAt: null },
      });
      expect(article.isPubliclyVisible(now)).toBe(false);
    });
  });

  describe('cloneWith', () => {
    it('should update specific fields and return a new instance', () => {
      const originalArticle = createBaseArticle();
      const clonedArticle = originalArticle.cloneWith({
        metadata: { title: 'Updated Title' },
      });

      expect(clonedArticle.metadata.title).toBe('Updated Title');
      expect(clonedArticle.metadata.slug).toBe(originalArticle.metadata.slug);
      expect(clonedArticle).not.toBe(originalArticle);
    });

    it('should not mutate the original instance', () => {
      const originalArticle = createBaseArticle();
      const originalTitle = originalArticle.metadata.title;

      originalArticle.cloneWith({
        metadata: { title: 'Updated Title' },
      });

      expect(originalArticle.metadata.title).toBe(originalTitle);
    });

    it('should handle deep nested updates (e.g., status)', () => {
      const originalArticle = createBaseArticle();
      const clonedArticle = originalArticle.cloneWith({
        control: { status: ArticleStatus.ARCHIVED },
      });

      expect(clonedArticle.control.status).toBe(ArticleStatus.ARCHIVED);
      expect(originalArticle.control.status).toBe(ArticleStatus.PUBLISHED);
    });
  });

  describe('Shortcuts (Delegation)', () => {
    it('should provide shortcuts for common properties', () => {
      const article = createBaseArticle();
      expect(article.id).toBe(article.control.id);
      expect(article.lang).toBe(article.control.lang);
      expect(article.status).toBe(article.control.status);
      expect(article.slug).toBe(article.metadata.slug);
      expect(article.category).toBe(article.metadata.category);
      expect(article.title).toBe(article.metadata.title);
      expect(article.publishedAt).toBe(article.metadata.publishedAt);
    });
  });
});
