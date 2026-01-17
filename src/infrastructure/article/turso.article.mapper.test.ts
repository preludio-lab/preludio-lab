import { describe, it, expect } from 'vitest';
import { TursoArticleMapper } from './turso.article.mapper';
import { AppError } from '@/domain/shared/app-error'; // Add import
import { AppLocale } from '@/domain/i18n/locale';
import { ArticleCategory } from '@/domain/article/article.metadata';
import { ArticleStatus } from '@/domain/article/article.control';
import { articles, articleTranslations } from '@/infrastructure/database/schema';
import { InferSelectModel } from 'drizzle-orm';

type ArticleRow = InferSelectModel<typeof articles>;
type TranslationRow = InferSelectModel<typeof articleTranslations>;

describe('TursoArticleMapper', () => {
  it('should map database rows to Article domain object correctly', () => {
    // モックデータ
    const mockArticleRow = {
      id: 'article-123',
      slug: 'my-article',
      category: ArticleCategory.WORKS,
      isFeatured: false,
      readingTimeSeconds: 120,
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
      slCategory: 'theory',
      slComposerName: 'J.S. Bach',
      metadata: {
        // Validation check: tags exist
        tags: ['music', 'bach'],
      },
      contentStructure: [{ type: 'paragraph', content: 'intro' }],
      slSeriesAssignments: [{ seriesId: 's1' }],
    };

    const mdxContent = '# MDX Content';

    // 実行
    const article = TursoArticleMapper.toDomain(
      mockArticleRow as unknown as ArticleRow,
      mockTranslationRow as unknown as TranslationRow,
      mdxContent,
    );

    // アサーション
    // Control
    expect(article.control.id).toBe('article-123');
    expect(article.control.lang).toBe(AppLocale.EN);
    expect(article.control.status).toBe(ArticleStatus.PUBLISHED);
    expect(article.control.createdAt).toEqual(new Date('2023-01-01T00:00:00Z'));
    expect(article.control.updatedAt).toEqual(new Date('2023-01-03T00:00:00Z'));

    // Metadata
    expect(article.metadata.slug).toBe('my-localized-slug'); // Localized slug preferred
    expect(article.metadata.title).toBe('My Article Title');
    expect(article.metadata.displayTitle).toBe('Display Title');
    expect(article.metadata.category).toBe(ArticleCategory.THEORY);
    expect(article.metadata.composerName).toBe('J.S. Bach');
    expect(article.metadata.tags).toEqual(['music', 'bach']);
    expect(article.metadata.readingTimeSeconds).toBe(120);
    expect(article.metadata.publishedAt).toEqual(new Date('2023-01-02T00:00:00Z'));
    expect(article.metadata.isFeatured).toBe(true);

    // Content
    expect(article.content.body).toBe(mdxContent);
    expect(article.content.structure).toEqual([{ type: 'paragraph', content: 'intro' }]);

    // Context
    expect(article.context.seriesAssignments).toEqual([{ seriesId: 's1' }]);
  });

  it('should throw AppError given invalid category', () => {
    const mockArticleRow = {
      id: 'article-456',
      slug: 'default-article',
      category: 'invalid-cat', // Invalid
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
      TursoArticleMapper.toDomain(
        mockArticleRow as unknown as ArticleRow,
        mockTranslationRow as unknown as TranslationRow,
        '',
      ),
    ).toThrowError(AppError);
  });
  it('should map undefined content to null body', () => {
    const mockArticleRow = {
      id: 'article-789',
      slug: 'no-content-article',
      category: ArticleCategory.WORKS,
      isFeatured: false,
      readingTimeSeconds: 0,
      createdAt: '2023-01-01T00:00:00Z',
    };

    const mockTranslationRow = {
      articleId: 'article-789',
      lang: 'en',
      status: ArticleStatus.PUBLISHED,
      title: 'No Content Title',
      displayTitle: 'Display',
      updatedAt: '2023-01-01T00:00:00Z',
      metadata: {},
      contentStructure: [],
      slSeriesAssignments: [],
    };

    const article = TursoArticleMapper.toDomain(
      mockArticleRow as unknown as ArticleRow,
      mockTranslationRow as unknown as TranslationRow,
      undefined, // undefined passed
    );

    expect(article.content.body).toBeNull();
    expect(article.metadata.slug).toBe('no-content-article');
  });
});
