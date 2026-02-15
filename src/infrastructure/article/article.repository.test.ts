import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ArticleRepositoryImpl } from './article.repository';
import {
  IArticleMetadataDataSource,
  ArticleMetadataRow,
} from './metadata/article.metadata.ds.interface';
import { ArticleCategory } from '@/domain/article/article.metadata';
import { AppLocale } from '@/domain/i18n/locale';
import { Logger } from '@/shared/logging/logger';
import { IObjectStorage } from '../storage/storage.interface';
import { ArticlePathStrategy } from './content/article.path.strategy';

import { TursoArticleMapper } from './metadata/turso.article.mapper';

describe('ArticleRepositoryImpl', () => {
  let repo: ArticleRepositoryImpl;

  const mockMetadataDS = {
    findBySlug: vi.fn(),
    findById: vi.fn(),
    findMany: vi.fn(),
    save: vi.fn(),
    deleteTranslation: vi.fn(),
    countTranslations: vi.fn(),
    findAllTranslations: vi.fn(),
    deleteAll: vi.fn(),
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
      (row) => TursoArticleMapper.toSummary(row.articles, row.article_translations),
      (row) => TursoArticleMapper.toAggregate(row.articles, row.article_translations),
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
    });
  });

  describe('findSummaryById', () => {
    it('should return ArticleSummary without content fetch', async () => {
      const mockRow = createMockRow('1', 'test-slug', 'en');
      mockMetadataDS.findById.mockResolvedValue(mockRow);

      const result = await repo.findSummaryById('1', 'en');

      expect(result).not.toBeNull();
      expect(result?.id).toBe('1');
      expect(mockMetadataDS.findById).toHaveBeenCalledWith('1', 'en');
      expect(mockPayloadDS.get).not.toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should return article summaries', async () => {
      const mockRow = createMockRow('1', 'test-slug', 'en');
      mockMetadataDS.findMany.mockResolvedValue({
        rows: [mockRow],
        totalCount: 1,
      });

      const result = await repo.search({
        filter: { lang: 'en' },
        pagination: { limit: 10, offset: 0 },
      });

      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(mockMetadataDS.findMany).toHaveBeenCalled();
      expect(mockPayloadDS.get).not.toHaveBeenCalled();
    });
  });

  describe('deleteById', () => {
    it('should delete translation and also master if it was the last one', async () => {
      const mockRow = createMockRow('1', 'test-slug', 'en');
      mockMetadataDS.findById.mockResolvedValue(mockRow);
      mockMetadataDS.countTranslations.mockResolvedValue(0); // 削除後に0件

      await repo.deleteById('1', 'en');

      expect(mockMetadataDS.deleteTranslation).toHaveBeenCalledWith('1', 'en');
      expect(mockMetadataDS.deleteAll).toHaveBeenCalledWith('1');
      expect(mockPayloadDS.delete).toHaveBeenCalledWith('works/test-slug/mdx/en.mdx');
    });

    it('should not delete master if other translations exist', async () => {
      const mockRow = createMockRow('1', 'test-slug', 'en');
      mockMetadataDS.findById.mockResolvedValue(mockRow);
      mockMetadataDS.countTranslations.mockResolvedValue(1); // 削除後にまだ1件ある

      await repo.deleteById('1', 'en');

      expect(mockMetadataDS.deleteTranslation).toHaveBeenCalledWith('1', 'en');
      expect(mockMetadataDS.deleteAll).not.toHaveBeenCalled();
    });
  });

  describe('deleteMaster', () => {
    it('should delete all translations and their storage files', async () => {
      const mockRowEn = createMockRow('1', 'slug', 'en');
      const mockRowJa = createMockRow('1', 'slug', 'ja');
      mockMetadataDS.findAllTranslations.mockResolvedValue([mockRowEn, mockRowJa]);

      await repo.deleteMaster('1');

      expect(mockPayloadDS.delete).toHaveBeenCalledTimes(2);
      expect(mockMetadataDS.deleteAll).toHaveBeenCalledWith('1');
    });
  });
});
