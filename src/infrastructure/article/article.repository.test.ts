import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ArticleRepositoryImpl } from './article.repository';
import {
  IArticleMetadataDataSource,
  ArticleMetadataRow,
} from './metadata/article.metadata.ds.interface';
import { ArticleCategory } from '@/domain/article/article.metadata';
import { AppLocale } from '@/domain/i18n/locale';
import { Logger } from '@/shared/logging/logger';
import { IObjectStorage, ObjectNotFoundError } from '../storage/storage.interface';
import { ArticlePathStrategy } from './content/article.path.strategy';

import { TursoArticleMapper } from './metadata/turso.article.mapper';

describe('ArticleRepositoryImpl', () => {
  let repo: ArticleRepositoryImpl;

  const mockMetadataDS = {
    findBySlug: vi.fn(),
    findById: vi.fn(),
    findMany: vi.fn(),
    save: vi.fn(),
    delete: vi.fn(),
  };

  const mockPayloadDS = {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  };

  const mockLogger = {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  };

  const pathStrategy = new ArticlePathStrategy();

  const createMockRow = (id: string, slug: string, lang: AppLocale) => {
    return {
      articles: {
        id,
        slug,
        category: ArticleCategory.WORKS,
        isFeatured: false,
        readingTimeSeconds: 60,
        thumbnailPath: 'thumb.jpg',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        workId: null,
      },
      article_translations: {
        id: `${id}-${lang}`,
        articleId: id,
        lang,
        status: 'published',
        title: 'Title',
        displayTitle: 'Display Title',
        publishedAt: new Date().toISOString(),
        isFeatured: false,
        slSlug: slug,
        slCategory: ArticleCategory.WORKS,
        metadata: {
          title: 'Title',
          displayTitle: 'Display Title',
          composerName: 'Test Composer',
          slug: slug,
          category: ArticleCategory.WORKS,
          thumbnail: 'thumb.jpg',
          tags: [],
        },
        contentStructure: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    } as unknown as ArticleMetadataRow;
  };

  beforeEach(() => {
    repo = new ArticleRepositoryImpl(
      mockMetadataDS as unknown as IArticleMetadataDataSource,
      mockPayloadDS as unknown as IObjectStorage,
      pathStrategy,
      (row) => TursoArticleMapper.toDomain(row.articles, row.article_translations),
      TursoArticleMapper.toPersistence,
      mockLogger as unknown as Logger,
    );
    vi.clearAllMocks();
  });

  describe('findById', () => {
    it('should return Article when metadata and content are found', async () => {
      const mockRow = createMockRow('1', 'test-slug', 'en');
      mockMetadataDS.findById.mockResolvedValue(mockRow);
      mockPayloadDS.get.mockResolvedValue('# Hello');

      const result = await repo.findById('1', 'en');

      expect(result).not.toBeNull();
      expect(result?.control.id).toBe('1');
      expect(result?.content.body).toBe('# Hello');
      expect(mockMetadataDS.findById).toHaveBeenCalledWith('1', 'en');
      expect(mockPayloadDS.get).toHaveBeenCalledWith('works/test-slug/mdx/en.mdx');
    });

    it('should return null if metadata not found', async () => {
      mockMetadataDS.findById.mockResolvedValue(null);

      const result = await repo.findById('999', 'en');
      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalled();
    });

    it('should return Article even if content is missing (e.g. 404 in storage)', async () => {
      const mockRow = createMockRow('1', 'test-slug', 'en');
      mockMetadataDS.findById.mockResolvedValue(mockRow);
      mockPayloadDS.get.mockRejectedValue(new ObjectNotFoundError('key'));

      const result = await repo.findById('1', 'en');
      expect(result).not.toBeNull();
      expect(result?.content.body).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalled();
    });
  });

  describe('findBySlug', () => {
    it('should return Article when metadata and content are found', async () => {
      const mockRow = createMockRow('1', 'test-slug', 'en');
      mockMetadataDS.findBySlug.mockResolvedValue(mockRow);
      mockPayloadDS.get.mockResolvedValue('# Hello');

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
      const mockRow = createMockRow('1', 'test-slug', 'en');
      mockMetadataDS.findMany.mockResolvedValue({
        rows: [mockRow],
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
      expect(mockPayloadDS.get).not.toHaveBeenCalled(); // Storage should NOT be called for list
    });
  });

  describe('save', () => {
    it('should call metadataDS.save and payloadDS.put', async () => {
      const mockRow = createMockRow('1', 'test-slug', 'en');
      const article = TursoArticleMapper.toDomain(
        mockRow.articles,
        mockRow.article_translations,
        '# Body',
      );

      await repo.save(article);

      expect(mockMetadataDS.save).toHaveBeenCalled();
      expect(mockPayloadDS.put).toHaveBeenCalledWith('works/test-slug/mdx/en.mdx', '# Body');
    });
  });

  describe('delete', () => {
    it('should call metadataDS.delete and payloadDS.delete', async () => {
      const mockRow = createMockRow('1', 'test-slug', 'en');
      mockMetadataDS.findById.mockResolvedValue(mockRow);

      await repo.delete('1');

      expect(mockMetadataDS.delete).toHaveBeenCalledWith('1');
      expect(mockPayloadDS.delete).toHaveBeenCalledWith('works/test-slug/mdx/en.mdx');
    });
  });
});
