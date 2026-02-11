import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ArticleRepositoryImpl } from './article.repository';
import { IArticleMetadataDataSource } from './metadata/article.metadata.ds.interface';
import { ArticleCategory, ArticleMetadata } from '@/domain/article/article.metadata';
import { Article, ArticleContent, ArticleId } from '@/domain/article/article';
import { ArticleStatus } from '@/domain/article/article.control';
import { AppLocale } from '@/domain/i18n/locale';
import { Logger } from '@/shared/logging/logger';
import { IObjectStorage, ObjectNotFoundError } from '../storage/storage.interface';
import { ArticlePathStrategy } from './content/article.path.strategy';

describe('ArticleRepositoryImpl', () => {
  let repo: ArticleRepositoryImpl;

  const mockMetadataDS = {
    findBySlug: vi.fn(),
    findById: vi.fn(),
    findMany: vi.fn(),
  };

  const mockStorage = {
    get: vi.fn(),
  };

  const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  const pathStrategy = new ArticlePathStrategy();

  const createMockArticle = (id: string, slug: string, lang: AppLocale) => {
    return new Article({
      control: {
        id: id as ArticleId,
        lang,
        status: ArticleStatus.PUBLISHED,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      metadata: {
        title: 'Title',
        displayTitle: 'Display Title',
        slug,
        category: ArticleCategory.WORKS,
        composerName: 'Composer',
        tags: [],
        thumbnail: 'thumb.jpg',
        publishedAt: new Date(),
        isFeatured: false,
        readingTimeSeconds: 60,
      } as ArticleMetadata,
      content: new ArticleContent({
        body: null,
        structure: [{ id: 'intro', heading: 'Introduction', level: 2 }],
      }),
      context: {
        seriesAssignments: [],
        relatedArticles: [],
        sourceAttributions: [],
        monetizationElements: [],
      },
    });
  };

  beforeEach(() => {
    repo = new ArticleRepositoryImpl(
      mockMetadataDS as unknown as IArticleMetadataDataSource,
      mockStorage as unknown as IObjectStorage,
      pathStrategy,
      mockLogger as unknown as Logger,
    );
    vi.clearAllMocks();
  });

  describe('findById', () => {
    it('should return Article when metadata and content are found', async () => {
      const mockArticle = createMockArticle('1', 'test-slug', 'en');
      mockMetadataDS.findById.mockResolvedValue(mockArticle);
      mockStorage.get.mockResolvedValue('# Hello');

      const result = await repo.findById('1', 'en');

      expect(result).not.toBeNull();
      expect(result?.control.id).toBe('1');
      expect(result?.content.body).toBe('# Hello');
      expect(mockMetadataDS.findById).toHaveBeenCalledWith('1', 'en');
      expect(mockStorage.get).toHaveBeenCalledWith('works/test-slug/mdx/en.mdx');
    });

    it('should return null if metadata not found', async () => {
      mockMetadataDS.findById.mockResolvedValue(null);

      const result = await repo.findById('999', 'en');
      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should return Article even if content is missing (e.g. 404 in storage)', async () => {
      const mockArticle = createMockArticle('1', 'test-slug', 'en');
      mockMetadataDS.findById.mockResolvedValue(mockArticle);
      mockStorage.get.mockRejectedValue(new ObjectNotFoundError('key'));

      const result = await repo.findById('1', 'en');
      expect(result).not.toBeNull();
      expect(result?.content.body).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('findBySlug', () => {
    it('should return Article when metadata and content are found', async () => {
      const mockArticle = createMockArticle('1', 'test-slug', 'en');
      mockMetadataDS.findBySlug.mockResolvedValue(mockArticle);
      mockStorage.get.mockResolvedValue('# Hello');

      const result = await repo.findBySlug('en', ArticleCategory.WORKS, 'test-slug');

      expect(result).not.toBeNull();
      expect(result?.metadata.title).toBe('Title');
      expect(result?.content.body).toBe('# Hello');
      expect(mockMetadataDS.findBySlug).toHaveBeenCalledWith(
        'test-slug',
        'en',
        ArticleCategory.WORKS,
      );
    });
  });

  describe('findMany', () => {
    it('should return articles with null content', async () => {
      const mockArticle = createMockArticle('1', 'test-slug', 'en');
      mockMetadataDS.findMany.mockResolvedValue({
        items: [mockArticle],
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
      expect(mockStorage.get).not.toHaveBeenCalled(); // Storage should NOT be called for list
    });
  });
});
