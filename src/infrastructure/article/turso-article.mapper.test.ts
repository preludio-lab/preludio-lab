import { describe, it, expect } from 'vitest';
import { TursoArticleMapper } from './turso-article.mapper';
import { AppLocale } from '@/domain/i18n/Locale';
import { ArticleCategory } from '@/domain/article/ArticleMetadata';

describe('TursoArticleMapper', () => {
  it('should map database rows to Article domain object correctly', () => {
    // モックデータ
    const mockArticleRow = {
      id: 'article-123',
      slug: 'my-article',
      isFeatured: false,
      createdAt: '2023-01-01T00:00:00Z',
    };

    const mockTranslationRow = {
      articleId: 'article-123',
      lang: 'en',
      status: 'PUBLISHED',
      title: 'My Article Title',
      publishedAt: '2023-01-02T00:00:00Z',
      updatedAt: '2023-01-03T00:00:00Z',
      isFeatured: true, // articleRow を上書きする
      metadata: {
        category: 'theory',
        tags: ['music', 'bach'],
      },
      contentStructure: [{ type: 'paragraph', content: 'intro' }],
      slSeriesAssignments: [{ seriesId: 's1' }],
    };

    const mdxContent = '# MDX Content';

    // 実行
    const article = TursoArticleMapper.toDomain(
      mockArticleRow as any,
      mockTranslationRow as any,
      mdxContent,
    );

    // アサーション
    // Control
    expect(article.control.id).toBe('article-123');
    expect(article.control.lang).toBe(AppLocale.EN);
    expect(article.control.status).toBe('PUBLISHED');
    expect(article.control.createdAt).toEqual(new Date('2023-01-01T00:00:00Z'));
    expect(article.control.updatedAt).toEqual(new Date('2023-01-03T00:00:00Z'));

    // Metadata
    expect(article.metadata.slug).toBe('my-article');
    expect(article.metadata.title).toBe('My Article Title');
    expect(article.metadata.category).toBe(ArticleCategory.THEORY);
    expect(article.metadata.tags).toEqual(['music', 'bach']);
    expect(article.metadata.publishedAt).toEqual(new Date('2023-01-02T00:00:00Z'));
    expect(article.metadata.isFeatured).toBe(true);

    // Content
    expect(article.content.body).toBe(mdxContent);
    expect(article.content.structure).toEqual([{ type: 'paragraph', content: 'intro' }]);

    // Context
    expect(article.context.seriesAssignments).toEqual([{ seriesId: 's1' }]);
  });

  it('should handle missing optional fields and defaults', () => {
    const mockArticleRow = {
      id: 'article-456',
      slug: 'default-article',
      isFeatured: false,
      createdAt: '2023-01-01T00:00:00Z',
    };

    const mockTranslationRow = {
      articleId: 'article-456',
      lang: 'ja',
      status: 'DRAFT',
      title: 'Draft Title',
      updatedAt: '2023-01-01T00:00:00Z',
      // metadata, publishedAt 等が欠落
      metadata: null,
      contentStructure: null,
      slSeriesAssignments: null,
    };

    const article = TursoArticleMapper.toDomain(
      mockArticleRow as any,
      mockTranslationRow as any,
      '',
    );

    // デフォルト値の検証
    expect(article.metadata.category).toBe('WORK'); // フォールバック
    expect(article.metadata.tags).toEqual([]);
    expect(article.metadata.publishedAt).toBeUndefined();
    expect(article.content.structure).toEqual([]);
    expect(article.context.seriesAssignments).toEqual([]);
  });
});
