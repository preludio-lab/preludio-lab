import { describe, it, expect } from 'vitest';
import { TursoArticleMapper } from './turso.article.metadata.mapper';
import { AppError } from '@/domain/shared/app-error';
import { AppLocale } from '@/domain/i18n/locale';
import { ArticleCategory } from '@/domain/article/article.metadata';
import { ArticleStatus } from '@/domain/article/article.control';
import { ArticleMasterRow, ArticleRow } from './article.metadata.ds';
import { ArticleSummary } from '@/domain/article/article';

describe('TursoArticleMapper', () => {
  const MASTER_ID = '018f1a2b-3c4d-7000-8000-deadbeef0001';
  const TRANSLATION_ID = '018f1a2b-3c4d-7001-8000-deadbeef0002';

  it('should map database rows to ArticleSummary domain object correctly', () => {
    // モックデータ (Master)
    const mockMasterRow = {
      id: MASTER_ID,
      slug: 'my-article',
      category: ArticleCategory.WORKS,
      isFeatured: false,
      readingTimeSeconds: 120,
      thumbnailPath: 'thumb.jpg',
      createdAt: '2023-01-01T00:00:00Z',
    };

    // モックデータ (Article/Translation)
    const mockArticleRow = {
      id: TRANSLATION_ID,
      articleId: MASTER_ID,
      lang: 'en',
      status: ArticleStatus.PUBLISHED,
      title: 'My Article Title',
      displayTitle: 'Display Title',
      publishedAt: '2023-01-02T00:00:00Z',
      updatedAt: '2023-01-03T00:00:00Z',
      isFeatured: true, // masterRow を上書きする
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
      mockMasterRow as unknown as ArticleMasterRow,
      mockArticleRow as unknown as ArticleRow,
    );

    // アサーション
    expect(summary).toBeInstanceOf(ArticleSummary);
    // Control
    expect(summary.control.id).toBe(TRANSLATION_ID);
    expect(summary.control.masterId).toBe(MASTER_ID);
    expect(summary.control.lang).toBe(AppLocale.EN);
    expect(summary.control.status).toBe(ArticleStatus.PUBLISHED);

    // Metadata
    expect(summary.metadata.slug).toBe('my-localized-slug');
    expect(summary.metadata.title).toBe('My Article Title');
    expect(summary.metadata.category).toBe(ArticleCategory.THEORY);

    // Persistence Check
    const persistence = TursoArticleMapper.toPersistence(summary);
    expect(persistence.articles.id).toBe(MASTER_ID);
    expect(persistence.article_translations.id).toBe(TRANSLATION_ID);
    expect(persistence.article_translations.articleId).toBe(MASTER_ID);
  });

  it('should throw AppError given invalid category', () => {
    const mockMasterRow = {
      id: MASTER_ID,
      slug: 'default-article',
      category: 'invalid-cat' as ArticleCategory,
      isFeatured: false,
      readingTimeSeconds: 0,
      createdAt: '2023-01-01T00:00:00Z',
    };

    const mockArticleRow = {
      id: TRANSLATION_ID,
      articleId: MASTER_ID,
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
        mockMasterRow as unknown as ArticleMasterRow,
        mockArticleRow as unknown as ArticleRow,
      ),
    ).toThrowError(AppError);
  });
});
