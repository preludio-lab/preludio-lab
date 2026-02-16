import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { TursoArticleMetadataDataSource } from './turso.article.metadata.ds';
import { db } from '../../database/turso.client';
import { Logger } from '@/shared/logging/logger';

// Mock DB
vi.mock('../../database/turso.client', () => ({
  db: {
    select: vi.fn(),
  },
}));

// Mock Mapper
vi.mock('./turso.article.metadata.mapper', () => ({
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
    it('should return raw data if found', async () => {
      const mockRawData = {
        articles: { id: '123' },
        article_translations: { lang: 'ja' },
      };

      mockLimit.mockResolvedValue([mockRawData]);

      const result = await dataSource.findById('123', 'ja');

      expect(result).toEqual(mockRawData);
    });

    it('should return undefined if not found', async () => {
      mockLimit.mockResolvedValue([]);
      const result = await dataSource.findById('999', 'en');
      expect(result).toBeUndefined();
    });
  });

  describe('findMany', () => {
    it('should return raw rows and totalCount', async () => {
      const mockRows = [
        { articles: { id: '1' }, article_translations: { lang: 'en' } },
        { articles: { id: '2' }, article_translations: { lang: 'en' } },
      ];

      mockOffset.mockResolvedValue(mockRows);

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

      expect(result.rows).toHaveLength(2);
      expect(result.rows[0].articles.id).toBe('1');
      expect(result.totalCount).toBe(10);
    });
  });
});
