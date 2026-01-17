import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { TursoArticleMetadataDataSource } from './turso.article.metadata.ds';
import { db } from '../database/turso.client';
import { ArticleCategory } from '@/domain/article/article.metadata';
import { Logger } from '@/shared/logging/logger';
import { AppError } from '@/domain/shared/app-error';

// turso-client モジュールのモック
vi.mock('../database/turso.client', () => ({
  db: {
    select: vi.fn(),
  },
}));

describe('TursoArticleMetadataDataSource', () => {
  let dataSource: TursoArticleMetadataDataSource;
  let mockLogger: Logger;

  // チェーンメソッドのモック
  const mockLimit = vi.fn();
  const mockOffset = vi.fn();
  const mockOrderBy = vi.fn(() => ({ limit: mockLimit }));
  const mockWhere = vi.fn(() => ({
    limit: mockLimit,
    orderBy: mockOrderBy,
  }));
  const mockInnerJoin = vi.fn(() => ({ where: mockWhere }));
  const mockFrom = vi.fn(() => ({ innerJoin: mockInnerJoin }));

  beforeEach(() => {
    mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };
    dataSource = new TursoArticleMetadataDataSource(mockLogger);
    vi.clearAllMocks();

    // モック実装のリセット
    // select() が from() を返すように設定
    // select({ count: ... }) も from() を返すように設定 (Count Query用)
    (db.select as unknown as Mock).mockReturnValue({ from: mockFrom });

    // チェーンスパイのリセット
    mockFrom.mockClear();
    mockInnerJoin.mockClear();
    mockWhere.mockClear();
    mockLimit.mockClear();
    mockOrderBy.mockClear();
    mockOffset.mockClear();

    // limit().offset() のチェーン設定
    mockLimit.mockReturnValue({ offset: mockOffset });
  });

  describe('findById', () => {
    it('should return the first result if found', async () => {
      const mockData = {
        articles: { id: '123', slug: 'test-slug' },
        article_translations: { title: 'Test Title', lang: 'ja' },
      };

      // findById は limit(1) で終わる
      mockLimit.mockResolvedValue([mockData]);

      const result = await dataSource.findById('123', 'ja');

      expect(result).toEqual(mockData);
      expect(db.select).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockInnerJoin).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('should return undefined if no result found', async () => {
      mockLimit.mockResolvedValue([]);

      const result = await dataSource.findById('999', 'en');

      expect(result).toBeUndefined();
    });

    it('should log error and throw AppError on database failure', async () => {
      const dbError = new Error('Database connection failed');
      mockLimit.mockRejectedValue(dbError);

      await expect(dataSource.findById('123', 'ja')).rejects.toThrow(AppError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'ArticleMetadataDataSource.findById error',
        dbError,
        { id: '123', lang: 'ja' },
      );
    });
  });

  describe('findBySlug', () => {
    it('should return the first result if found', async () => {
      const mockData = {
        articles: { id: '123', slug: 'target-slug' },
        article_translations: { title: 'Target Title', lang: 'en' },
      };

      mockLimit.mockResolvedValue([mockData]);

      const result = await dataSource.findBySlug('target-slug', 'en', ArticleCategory.WORKS);

      expect(result).toEqual(mockData);
      expect(mockWhere).toHaveBeenCalled();
    });

    it('should return undefined if no result found', async () => {
      mockLimit.mockResolvedValue([]);

      const result = await dataSource.findBySlug('unknown-slug', 'fr');

      expect(result).toBeUndefined();
    });

    it('should log error and throw AppError on database failure', async () => {
      const dbError = new Error('Database query failed');
      mockLimit.mockRejectedValue(dbError);

      await expect(dataSource.findBySlug('slug', 'en')).rejects.toThrow(AppError);

      expect(mockLogger.error).toHaveBeenCalledWith(
        'ArticleMetadataDataSource.findBySlug error',
        dbError,
        { slug: 'slug', lang: 'en', category: undefined },
      );
    });
  });

  describe('findMany', () => {
    it('should return rows and totalCount', async () => {
      const mockRows = [{ id: '1' }, { id: '2' }];

      mockOffset.mockResolvedValue(mockRows);

      const thenableWhereResult = {
        limit: mockLimit,
        orderBy: mockOrderBy,
        then: (resolve: (value: { count: number }[]) => void) => resolve([{ count: 2 }]),
      };

      mockWhere.mockReturnValue(thenableWhereResult as unknown as ReturnType<typeof mockWhere>);

      const result = await dataSource.findMany({
        filter: {
          lang: 'en',
          category: ArticleCategory.WORKS,
        },
        pagination: {
          limit: 10,
          offset: 0,
        },
      });

      expect(result.rows).toEqual(mockRows);
      expect(result.totalCount).toBe(2);

      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(mockOffset).toHaveBeenCalledWith(0);
      expect(mockOrderBy).toHaveBeenCalled();
      expect(db.select).toHaveBeenCalledTimes(2);
    });

    it('should log error and throw AppError on database failure', async () => {
      const dbError = new Error('Database query failed');
      // findMany does Promise.all, so if one fails, it rejects.
      mockOffset.mockRejectedValue(dbError);

      // Need to mock the second query (count) to not fail immediately/sync before the first one (or ensure Promise.all catches it)
      // Since Promise.all handles rejections, we just need one of them to reject.
      // But we need to ensure the mocks are set up so execution proceeds to the Promise.all.
      const thenableWhereResult = {
        limit: mockLimit,
        orderBy: mockOrderBy,
        then: (resolve: (value: { count: number }[]) => void) => resolve([{ count: 0 }]),
      };
      mockWhere.mockReturnValue(thenableWhereResult as unknown as ReturnType<typeof mockWhere>);

      await expect(
        dataSource.findMany({
          filter: { lang: 'en' },
          pagination: { limit: 10, offset: 0 },
        }),
      ).rejects.toThrow(AppError);

      expect(mockLogger.error).toHaveBeenCalled();
      // Verify logger call arguments if needed
      expect(mockLogger.error).toHaveBeenCalledWith(
        'ArticleMetadataDataSource.findMany error',
        dbError,
        expect.anything(),
      );
    });
  });
});
