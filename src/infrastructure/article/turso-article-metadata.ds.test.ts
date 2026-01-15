import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { ArticleMetadataDataSource } from './turso-article-metadata.ds';
import { db } from '../database/turso-client';

// turso-client モジュールのモック
vi.mock('../database/turso-client', () => ({
  db: {
    select: vi.fn(),
  },
}));

describe('ArticleMetadataDataSource', () => {
  let dataSource: ArticleMetadataDataSource;

  // チェーンメソッドのモック
  const mockLimit = vi.fn();
  const mockWhere = vi.fn(() => ({ limit: mockLimit }));
  const mockInnerJoin = vi.fn(() => ({ where: mockWhere }));
  const mockFrom = vi.fn(() => ({ innerJoin: mockInnerJoin }));

  beforeEach(() => {
    dataSource = new ArticleMetadataDataSource();
    vi.clearAllMocks();

    // モック実装のリセット
    (db.select as unknown as Mock).mockReturnValue({ from: mockFrom });

    // チェーンスパイのリセット
    mockFrom.mockClear();
    mockInnerJoin.mockClear();
    mockWhere.mockClear();
    mockLimit.mockClear();
  });

  describe('findById', () => {
    it('should return the first result if found', async () => {
      const mockData = {
        articles: { id: '123', slug: 'test-slug' },
        article_translations: { title: 'Test Title', lang: 'ja' },
      };

      mockLimit.mockResolvedValue([mockData]);

      const result = await dataSource.findById('123', 'ja');

      expect(result).toEqual(mockData);
      expect(db.select).toHaveBeenCalled();
      expect(mockFrom).toHaveBeenCalled();
      expect(mockInnerJoin).toHaveBeenCalled();
      expect(mockWhere).toHaveBeenCalled();
      expect(mockLimit).toHaveBeenCalledWith(1);
    });

    it('should return null if no result found', async () => {
      mockLimit.mockResolvedValue([]);

      const result = await dataSource.findById('999', 'en');

      expect(result).toBeNull();
    });
  });

  describe('findBySlug', () => {
    it('should return the first result if found', async () => {
      const mockData = {
        articles: { id: '123', slug: 'target-slug' },
        article_translations: { title: 'Target Title', lang: 'en' },
      };

      mockLimit.mockResolvedValue([mockData]);

      const result = await dataSource.findBySlug('target-slug', 'en');

      expect(result).toEqual(mockData);
      expect(mockWhere).toHaveBeenCalled();
    });

    it('should return null if no result found', async () => {
      mockLimit.mockResolvedValue([]);

      const result = await dataSource.findBySlug('unknown-slug', 'fr');

      expect(result).toBeNull();
    });
  });
});
