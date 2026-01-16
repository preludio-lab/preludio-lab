import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TursoArticleRepository } from './turso-article.repository';
import { ArticleMetadataDataSource } from './turso-article-metadata.ds';
import { ArticleContentDataSource } from './r2-article-content.ds';
import { ArticleCategory } from '@/domain/article/ArticleMetadata';
import { Logger } from '@/shared/logging/logger';
import { AppError } from '@/domain/shared/AppError';

describe('TursoArticleRepository', () => {
  let repo: TursoArticleRepository;

  const mockMetadataDS = {
    findBySlug: vi.fn(),
    findById: vi.fn(),
  };

  const mockContentDS = {
    getContent: vi.fn(),
  };

  const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  beforeEach(() => {
    repo = new TursoArticleRepository(
      mockMetadataDS as unknown as ArticleMetadataDataSource,
      mockContentDS as unknown as ArticleContentDataSource,
      mockLogger as unknown as Logger,
    );
    vi.clearAllMocks();
  });

  describe('findById', () => {
    it('should return Article when metadata and content are found', async () => {
      const mockRow = {
        articles: { id: '1', slug: 'slug', category: 'work', createdAt: '2023-01-01' },
        article_translations: {
          articleId: '1',
          lang: 'en',
          status: 'PUBLISHED',
          title: 'Title',
          displayTitle: 'Display Title',
          updatedAt: '2023-01-01',
          slSlug: 'slug',
          slComposerName: 'Composer',
          metadata: { category: 'works', tags: [] },
          mdxPath: 'path/to/content.mdx',
        },
      };
      mockMetadataDS.findById.mockResolvedValue(mockRow);
      mockContentDS.getContent.mockResolvedValue('# Hello');

      const result = await repo.findById('1', 'en');

      expect(result).not.toBeNull();
      expect(result?.control.id).toBe('1');
      expect(mockMetadataDS.findById).toHaveBeenCalledWith('1', 'en');
    });

    it('should return null if metadata not found', async () => {
      mockMetadataDS.findById.mockResolvedValue(null);

      const result = await repo.findById('999', 'en');
      expect(result).toBeNull();
    });
  });

  it('findBySlug should return Article when metadata and content are found', async () => {
    // Metadata モックの設定
    const mockRow = {
      articles: {
        id: '1',
        slug: 'slug',
        category: 'work',
        isFeatured: false,
        createdAt: '2023-01-01',
      },
      article_translations: {
        articleId: '1',
        lang: 'en',
        status: 'PUBLISHED',
        title: 'Title',
        displayTitle: 'Display Title',
        updatedAt: '2023-01-01',
        slSlug: 'slug',
        slComposerName: 'Composer',
        metadata: { category: 'works', tags: [] },
        mdxPath: 'path/to/content.mdx',
      },
    };
    mockMetadataDS.findBySlug.mockResolvedValue(mockRow);

    // Content モックの設定
    mockContentDS.getContent.mockResolvedValue('# Hello');

    const result = await repo.findBySlug('en', ArticleCategory.WORKS, 'slug');

    expect(result).not.toBeNull();
    expect(result?.metadata.title).toBe('Title');
    expect(result?.content.body).toBe('# Hello');

    expect(mockMetadataDS.findBySlug).toHaveBeenCalledWith('slug', 'en', ArticleCategory.WORKS);
    expect(mockContentDS.getContent).toHaveBeenCalledWith('path/to/content.mdx');
  });

  it('findBySlug should return null if metadata not found', async () => {
    mockMetadataDS.findBySlug.mockResolvedValue(null);

    const result = await repo.findBySlug('en', ArticleCategory.WORKS, 'slug');

    expect(result).toBeNull();
    expect(mockLogger.warn).toHaveBeenCalled();
    expect(mockContentDS.getContent).not.toHaveBeenCalled();
  });

  it('findBySlug should return Article with empty content if mdxPath missing', async () => {
    const mockRow = {
      articles: { id: '1', slug: 'slug', category: 'work', createdAt: '2023-01-01' },
      article_translations: {
        articleId: '1',
        lang: 'en',
        title: 'Title',
        displayTitle: 'Display Title',
        updatedAt: '2023-01-01',
        slComposerName: 'Composer',
        metadata: { category: 'works', tags: [] },
        mdxPath: null, // パスなし
      },
    };
    mockMetadataDS.findBySlug.mockResolvedValue(mockRow);

    const result = await repo.findBySlug('en', ArticleCategory.WORKS, 'slug');

    expect(result).not.toBeNull();
    expect(result?.content.body).toBe(''); // mdxPathがない場合は空文字 (Mapperの仕様)
    expect(mockContentDS.getContent).not.toHaveBeenCalled();
  });

  it('findMany should return articles with null content', async () => {
    // mock findMany implementation
    (mockMetadataDS as any).findMany = vi.fn().mockResolvedValue({
      rows: [
        {
          articles: { id: '1', slug: 'slug1', category: 'work' },
          article_translations: {
            title: 'Title 1',
            lang: 'en',
            metadata: { category: 'works' },
            slSlug: 'slug1', // Add required fields for mapper
            slCategory: 'works',
          },
        },
      ],
      totalCount: 1,
    });

    const result = await repo.findMany({ lang: 'en' });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].content.body).toBeNull();
    expect(result.totalCount).toBe(1);
    expect((mockMetadataDS as any).findMany).toHaveBeenCalled();
  });
});
