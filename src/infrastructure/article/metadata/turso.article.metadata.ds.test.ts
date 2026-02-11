import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { TursoArticleMetadataDataSource } from './turso.article.metadata.ds';
import { db } from '../../database/turso.client';
import { Logger } from '@/shared/logging/logger';
import { TursoArticleMapper } from './turso.article.mapper';
import { Article } from '@/domain/article/article';

// Mock DB
vi.mock('../../database/turso.client', () => ({
  db: {
    select: vi.fn(),
  },
}));

// Mock Mapper
vi.mock('./turso.article.mapper', () => ({
  TursoArticleMapper: {
    toDomain: vi.fn(),
  },
}));

describe('TursoArticleMetadataDataSource', () => {
  let dataSource: TursoArticleMetadataDataSource;
  let mockLogger: Logger;

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
    } as unknown as Logger;
    dataSource = new TursoArticleMetadataDataSource(mockLogger);
    vi.clearAllMocks();

    (db.select as unknown as Mock).mockReturnValue({ from: mockFrom });
    mockLimit.mockReturnValue({ offset: mockOffset });
  });

  describe('findById', () => {
    it('should return Article if found', async () => {
      const mockRawData = {
        articles: { id: '123' },
        article_translations: { lang: 'ja' },
      };
      const mockArticle = { control: { id: '123' } } as Article;

      mockLimit.mockResolvedValue([mockRawData]);
      vi.mocked(TursoArticleMapper.toDomain).mockReturnValue(mockArticle);

      const result = await dataSource.findById('123', 'ja');

      expect(result).toBe(mockArticle);
      expect(TursoArticleMapper.toDomain).toHaveBeenCalledWith(
        mockRawData.articles,
        mockRawData.article_translations,
        null,
      );
    });

    it('should return undefined if not found', async () => {
      mockLimit.mockResolvedValue([]);
      const result = await dataSource.findById('999', 'en');
      expect(result).toBeUndefined();
    });
  });

  describe('findMany', () => {
    it('should return articles and totalCount', async () => {
      const mockRows = [
        { articles: { id: '1' }, article_translations: { lang: 'en' } },
        { articles: { id: '2' }, article_translations: { lang: 'en' } },
      ];
      const mockArticle1 = { control: { id: '1' } } as Article;
      const mockArticle2 = { control: { id: '2' } } as Article;

      mockOffset.mockResolvedValue(mockRows);
      vi.mocked(TursoArticleMapper.toDomain)
        .mockReturnValueOnce(mockArticle1)
        .mockReturnValueOnce(mockArticle2);

      const thenableWhereResult = {
        limit: mockLimit,
        orderBy: mockOrderBy,
        then: (resolve: (value: { count: number }[]) => void) => resolve([{ count: 10 }]),
      };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      mockWhere.mockReturnValue(thenableWhereResult as any);

      const result = await dataSource.findMany({
        filter: { lang: 'en' },
        pagination: { limit: 2, offset: 0 },
      });

      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toBe(mockArticle1);
      expect(result.totalCount).toBe(10);
    });
  });
});
