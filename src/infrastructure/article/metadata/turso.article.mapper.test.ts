import { describe, it, expect } from 'vitest';
import { TursoArticleMapper } from './turso.article.mapper';
import { AppError } from '@/domain/shared/app-error';
import { AppLocale } from '@/domain/i18n/locale';
import { ArticleCategory } from '@/domain/article/article.metadata';
import { ArticleStatus } from '@/domain/article/article.control';
import { ArticleRow, TranslationRow } from './article.metadata.ds.interface';
import { ArticleSummary } from '@/domain/article/article';

describe('TursoArticleMapper', () => {
  it('should map database rows to ArticleSummary domain object correctly', () => {
    // モックデータ
    const mockArticleRow = {
      id: 'article-123',
      slug: 'my-article',
      category: ArticleCategory.WORKS,
      isFeatured: false,
      readingTimeSeconds: 120,
      thumbnailPath: 'thumb.jpg',
      createdAt: '2023-01-01T00:00:00Z',
    };

    const mockTranslationRow = {
      articleId: 'article-123',
      lang: 'en',
      status: ArticleStatus.PUBLISHED,
      title: 'My Article Title',
      displayTitle: 'Display Title',
      publishedAt: '2023-01-02T00:00:00Z',
      updatedAt: '2023-01-03T00:00:00Z',
      isFeatured: true, // articleRow を上書きする
      slSlug: 'my-localized-slug',
      slCategory: ArticleCategory.THEORY,
      slComposerName: 'J.S. Bach',
      metadata: {
        tags: ['music', 'bach'],
      },
      contentStructure: [],
      slSeriesAssignments: [{ seriesId: 's1' }],
    };

    // 実行
    const summary = TursoArticleMapper.toSummary(
      mockArticleRow as unknown as ArticleRow,
      mockTranslationRow as unknown as TranslationRow,
    );

    // アサーション
    expect(summary).toBeInstanceOf(ArticleSummary);
    // Control
    expect(summary.control.id).toBe('article-123');
    expect(summary.control.lang).toBe(AppLocale.EN);
    expect(summary.control.status).toBe(ArticleStatus.PUBLISHED);

    // Metadata
    expect(summary.metadata.slug).toBe('my-localized-slug');
    expect(summary.metadata.title).toBe('My Article Title');
    expect(summary.metadata.category).toBe(ArticleCategory.THEORY);
    expect(summary.metadata.composerName).toBe('J.S. Bach');
    expect(summary.metadata.tags).toEqual(['music', 'bach']);
    expect(summary.metadata.thumbnail).toBe('thumb.jpg');

    // Context
    expect(summary.context.seriesAssignments).toEqual([{ seriesId: 's1' }]);
  });

  it('should throw AppError given invalid category', () => {
    const mockArticleRow = {
      id: 'article-456',
      slug: 'default-article',
      category: 'invalid-cat' as ArticleCategory,
      isFeatured: false,
      readingTimeSeconds: 0,
      createdAt: '2023-01-01T00:00:00Z',
    };

    const mockTranslationRow = {
      articleId: 'article-456',
      lang: 'ja',
      status: ArticleStatus.DRAFT,
      title: 'Draft Title',
      displayTitle: 'Draft Display',
      updatedAt: '2023-01-01T00:00:00Z',
      metadata: {},
      contentStructure: [],
      slSeriesAssignments: null,
    };

    expect(() =>
      TursoArticleMapper.toSummary(
        mockArticleRow as unknown as ArticleRow,
        mockTranslationRow as unknown as TranslationRow,
      ),
    ).toThrowError(AppError);
  });
});
