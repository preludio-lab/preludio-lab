import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ArticleRepositoryImpl } from './article.repository';
import { IArticleMetadataDataSource, ArticleMetadataRow } from './metadata/article.metadata.ds';
import { ArticleMasterId } from '@/domain/article/article.control';
import { ArticleCategory } from '@/domain/article/article.metadata';
import { AppLocale } from '@/domain/i18n/locale';
import { Logger } from '@/shared/logging/logger';
import { IObjectStorage } from '../storage/storage.interface';
import { TursoArticleMapper } from './metadata/turso.article.metadata.mapper';
import { ArticlePathStrategy } from './content/article.path.strategy';
import { Article } from '@/domain/article/article';
import { ArticleContentMapper } from './content/article.content.mapper';

describe('ArticleRepositoryImpl', () => {
  let repo: ArticleRepositoryImpl;

  const MASTER_UUID = '018f1a2b-3c4d-7000-8000-deadbeef0001' as ArticleMasterId;
  const EN_TRANS_UUID = '018f1a2b-3c4d-7001-8000-deadbeef0002';
  const JA_TRANS_UUID = '018f1a2b-3c4d-7002-8000-deadbeef0003';

  const mockMetadataDS = {
    findBySlug: vi.fn(),
    findById: vi.fn(),
    search: vi.fn(),
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

  const createMockRow = (masterId: string, transId: string, slug: string, lang: AppLocale) => {
    return {
      articles: {
        id: masterId,
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
        id: transId,
        articleId: masterId,
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
      new ArticlePathStrategy(),
      (row) => TursoArticleMapper.toSummary(row.articles, row.article_translations),
      (summary, payload) => {
        return new Article({
          control: summary.control,
          metadata: summary.metadata,
          engagement: summary.engagement,
          context: summary.context,
          content: ArticleContentMapper.toDomain(payload),
        });
      },
      TursoArticleMapper.toPersistence,
      (article) => ArticleContentMapper.toPersistence(article.content),
      mockLogger as unknown as Logger,
    );
    vi.clearAllMocks();
  });

  describe('findById', () => {
    it('should return Article when metadata and content are found', async () => {
      const mockRow = createMockRow(MASTER_UUID, EN_TRANS_UUID, 'test-slug', 'en');
      mockMetadataDS.findById.mockResolvedValue(mockRow);
      mockPayloadDS.get.mockResolvedValue('# Hello');

      const result = await repo.findById(MASTER_UUID, 'en');

      expect(result).not.toBeNull();
      expect(result?.control.id).toBe(EN_TRANS_UUID); // ID should be translation UUID
      expect(result?.control.masterId).toBe(MASTER_UUID);
      expect(result?.content.body).toBe('# Hello');
      expect(mockMetadataDS.findById).toHaveBeenCalledWith(MASTER_UUID, 'en');
      expect(mockPayloadDS.get).toHaveBeenCalledWith('works/test-slug/mdx/en.mdx');
    });

    it('should return null if metadata not found', async () => {
      mockMetadataDS.findById.mockResolvedValue(null);

      const result = await repo.findById(MASTER_UUID, 'en');
      expect(result).toBeNull();
    });
  });

  describe('findSummaryById', () => {
    it('should return ArticleSummary without content fetch', async () => {
      const mockRow = createMockRow(MASTER_UUID, EN_TRANS_UUID, 'test-slug', 'en');
      mockMetadataDS.findById.mockResolvedValue(mockRow);

      const result = await repo.findSummaryById(MASTER_UUID, 'en');

      expect(result).not.toBeNull();
      expect(result?.id).toBe(EN_TRANS_UUID);
      expect(result?.masterId).toBe(MASTER_UUID);
      expect(mockMetadataDS.findById).toHaveBeenCalledWith(MASTER_UUID, 'en');
      expect(mockPayloadDS.get).not.toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should return article summaries', async () => {
      const mockRow = createMockRow(MASTER_UUID, EN_TRANS_UUID, 'test-slug', 'en');
      mockMetadataDS.search.mockResolvedValue({
        rows: [mockRow],
        totalCount: 1,
      });

      const result = await repo.search({
        filter: { lang: 'en' },
        pagination: { limit: 10, offset: 0 },
      });

      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.items[0].id).toBe(EN_TRANS_UUID);
      expect(result.items[0].masterId).toBe(MASTER_UUID);
      expect(mockMetadataDS.search).toHaveBeenCalled();
      expect(mockPayloadDS.get).not.toHaveBeenCalled();
    });
  });

  describe('deleteById', () => {
    it('should delete translation and also master if it was the last one', async () => {
      const mockRow = createMockRow(MASTER_UUID, EN_TRANS_UUID, 'test-slug', 'en');
      mockMetadataDS.findById.mockResolvedValue(mockRow);
      mockMetadataDS.countTranslations.mockResolvedValue(0); // 削除後に0件

      await repo.deleteById(MASTER_UUID, 'en');

      expect(mockMetadataDS.deleteTranslation).toHaveBeenCalledWith(MASTER_UUID, 'en');
      expect(mockMetadataDS.deleteAll).toHaveBeenCalledWith(MASTER_UUID);
      expect(mockPayloadDS.delete).toHaveBeenCalledWith('works/test-slug/mdx/en.mdx');
    });

    it('should not delete master if other translations exist', async () => {
      const mockRow = createMockRow(MASTER_UUID, EN_TRANS_UUID, 'test-slug', 'en');
      mockMetadataDS.findById.mockResolvedValue(mockRow);
      mockMetadataDS.countTranslations.mockResolvedValue(1); // 削除後にまだ1件ある

      await repo.deleteById(MASTER_UUID, 'en');

      expect(mockMetadataDS.deleteTranslation).toHaveBeenCalledWith(MASTER_UUID, 'en');
      expect(mockMetadataDS.deleteAll).not.toHaveBeenCalled();
    });
  });

  describe('deleteMaster', () => {
    it('should delete all translations and their storage files', async () => {
      const mockRowEn = createMockRow(MASTER_UUID, EN_TRANS_UUID, 'slug', 'en');
      const mockRowJa = createMockRow(MASTER_UUID, JA_TRANS_UUID, 'slug', 'ja');
      mockMetadataDS.findAllTranslations.mockResolvedValue([mockRowEn, mockRowJa]);

      await repo.deleteMaster(MASTER_UUID);

      expect(mockPayloadDS.delete).toHaveBeenCalledTimes(2);
      expect(mockMetadataDS.deleteAll).toHaveBeenCalledWith(MASTER_UUID);
    });
  });
});
