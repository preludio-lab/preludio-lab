import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ArticleRepositoryImpl } from './article.repository';
import { IArticleMetadataDataSource } from './interfaces/article-metadata-data-source.interface';
import { IArticleContentDataSource } from './interfaces/article-content-data-source.interface';
import { ArticleCategory } from '@/domain/article/ArticleMetadata';
import { Logger } from '@/shared/logging/logger';
import { articles, articleTranslations } from '../database/schema/articles';

describe('ArticleRepositoryImpl', () => {
  let repo: ArticleRepositoryImpl;

  const mockMetadataDS = {
    findBySlug: vi.fn(),
    findById: vi.fn(),
    findMany: vi.fn(),
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
    repo = new ArticleRepositoryImpl(
      mockMetadataDS as unknown as IArticleMetadataDataSource,
      mockContentDS as unknown as IArticleContentDataSource,
      mockLogger as unknown as Logger,
    );
    vi.clearAllMocks();
  });

  describe('findById', () => {
    it('should return Article when metadata and content are found', async () => {
      const mockRow = {
        articles: { id: '1', slug: 'slug', category: 'works', createdAt: '2023-01-01' },
        article_translations: {
          articleId: '1',
          lang: 'en',
          status: 'published',
          title: 'Title',
          displayTitle: 'Display Title',
          updatedAt: '2023-01-01',
          slSlug: 'slug',
          slComposerName: 'Composer',
          metadata: { category: 'works', tags: [] },
          mdxPath: 'en/works/slug',
          contentStructure: [], // Provided by DS now
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

  describe('findBySlug', () => {
    it('should return Article when metadata and content are found', async () => {
      const mockRow = {
        articles: {
          id: '1',
          slug: 'slug',
          category: 'works',
          isFeatured: false,
          createdAt: '2023-01-01',
        },
        article_translations: {
          articleId: '1',
          lang: 'en',
          status: 'published',
          title: 'Title',
          displayTitle: 'Display Title',
          updatedAt: '2023-01-01',
          slSlug: 'slug',
          slComposerName: 'Composer',
          metadata: { category: 'works', tags: [] },
          mdxPath: 'en/works/slug',
          contentStructure: [{ id: 'intro', heading: 'Introduction', level: 2 }],
        },
      };
      mockMetadataDS.findBySlug.mockResolvedValue(mockRow);
      mockContentDS.getContent.mockResolvedValue('# Hello');

      const result = await repo.findBySlug('en', ArticleCategory.WORKS, 'slug');

      expect(result).not.toBeNull();
      expect(result?.metadata.title).toBe('Title');
      expect(result?.content.body).toBe('# Hello');
      expect(result?.content.structure).toHaveLength(1); // Mapped from metadata
      expect(result?.content.structure[0].heading).toBe('Introduction');

      expect(mockMetadataDS.findBySlug).toHaveBeenCalledWith('slug', 'en', ArticleCategory.WORKS);
      expect(mockContentDS.getContent).toHaveBeenCalledWith('en/works/slug.mdx');
    });

    it('should return null if metadata not found', async () => {
      mockMetadataDS.findBySlug.mockResolvedValue(null);

      const result = await repo.findBySlug('en', ArticleCategory.WORKS, 'slug');

      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalled();
      expect(mockContentDS.getContent).not.toHaveBeenCalled();
    });
  });

  describe('findMany', () => {
    it('should return articles with null content', async () => {
      vi.mocked(mockMetadataDS.findMany).mockResolvedValue({
        rows: [
          {
            articles: {
              id: '1',
              slug: 'slug1',
              category: 'works',
              isFeatured: false,
              readingTimeSeconds: 60,
              thumbnailPath: null,
              createdAt: '2023-01-01',
              updatedAt: '2023-01-01',
              workId: null,
            } as typeof articles.$inferSelect,
            article_translations: {
              id: '1',
              articleId: '1',
              title: 'Title 1',
              displayTitle: 'Title 1',
              lang: 'en',
              status: 'published',
              metadata: { category: 'works' },
              slSlug: 'slug1',
              slCategory: 'works',
              updatedAt: '2023-01-01',
              slComposerName: 'Composer',
              publishedAt: '2023-01-01',
              catchcopy: null,
              excerpt: null,
              isFeatured: false,
              mdxPath: 'en/works/slug1',
              slEra: null,
              slGenre: [],
              slImpressionDimensions: null,
              slInstrumentations: [],
              slKey: null,
              slNationality: null,
              slPerformanceDifficulty: null,
              slSeriesAssignments: [],
              slWorkCatalogueId: null,
              slWorkNicknames: [],
              contentEmbedding: null,
              contentStructure: {},
              createdAt: '2023-01-01',
            } as unknown as typeof articleTranslations.$inferSelect,
          },
        ],
        totalCount: 1,
      });

      const result = await repo.findMany({
        filter: { lang: 'en' },
        pagination: { limit: 10, offset: 0 },
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].content.body).toBeNull();
      expect(result.totalCount).toBe(1);
      expect(mockMetadataDS.findMany).toHaveBeenCalled();
    });
  });
});
