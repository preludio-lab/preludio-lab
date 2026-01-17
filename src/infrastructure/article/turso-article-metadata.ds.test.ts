import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { ArticleMetadataDataSource } from './turso-article-metadata.ds';
import { db } from '../database/turso-client';
import { ArticleCategory } from '@/domain/article/ArticleMetadata';

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
  const mockOffset = vi.fn();
  const mockOrderBy = vi.fn(() => ({ limit: mockLimit }));
  const mockWhere = vi.fn(() => ({
    limit: mockLimit,
    orderBy: mockOrderBy,
  }));
  const mockInnerJoin = vi.fn(() => ({ where: mockWhere }));
  const mockFrom = vi.fn(() => ({ innerJoin: mockInnerJoin }));

  beforeEach(() => {
    dataSource = new ArticleMetadataDataSource();
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
      // カテゴリが含まれているかの厳密なチェックはDrizzleのeqオブジェクト比較が必要だが、
      // ここでは呼び出しフローを確認する
    });

    it('should return undefined if no result found', async () => {
      mockLimit.mockResolvedValue([]);

      const result = await dataSource.findBySlug('unknown-slug', 'fr');

      expect(result).toBeUndefined();
    });
  });

  describe('findMany', () => {
    it('should return rows and totalCount', async () => {
      const mockRows = [{ id: '1' }, { id: '2' }];

      // findMany executes two queries in parallel via Promise.all
      // We need to handle two calls to db.select()

      // Setup specific return values for the promise chains
      // 1. Data Query: select() -> ... -> limit().offset() -> resolved value
      mockOffset.mockResolvedValueOnce(mockRows);

      // 2. Count Query: select({count}) -> ... -> where() -> resolved value
      // Count query stops at where() and resolves.
      // However, db.select() is called twice. We need to distinguish or just let them behave similarly.
      // The implementation awaits Promise.all([rowsPromise, countPromise])
      // rowsQuery ends with .offset()
      // countQuery ends with .where()

      // Re-setup mockWhere for count query specifically?
      // Actually, since countQuery ends at where(), calling `await countQuery` means awaiting the object returned by where().
      // Drizzle objects are "thenable" (QueryPromise).
      // We'll simulate this by making mockWhere return a Promise-like object OR just checking the call order.
      // But in our mock setup, `where` returns an object with `orderBy`.

      // To simulate `await countQuery`, strict mocking of Drizzle is hard.
      // Ideally we mock `where` to return a user-defined promise or object.
      // But `rowsQuery` continues AFTER where to orderBy.

      // Simplified approach: Mock `Promise.all`? No, that tests the runtime.
      // Better approach: Make the chain return Promises that resolve to expected data.

      // Let's refine the mock structure for findMany.
      // Query 1 (Rows): select -> ... -> where -> orderBy -> limit -> offset -> RET
      // Query 2 (Count): select -> ... -> where -> RET (if we treat it as awaited directly, but Drizzle uses .then or await)

      // For this test, verifying that it constructs correct chains is enough.
      // We can force the "await" to return data by mocking the final method in the chain.

      // For Query 1 (Rows), it awaits `.offset(...)`.
      mockOffset.mockResolvedValue(mockRows);

      // For Query 2 (Count), it awaits `.where(...)`.
      // But wait, `where` returns the query builder which has `orderBy` etc.
      // If we await the builder, it executes.
      // In Drizzle, `where(...)` returns a QueryBuilder which is thenable.
      // We need to attach a `.then` or just make it a Promise.

      // Let's try to mock the return of `where` to be a Promise-like object that ALSO has `orderBy`.
      const thenableWhereResult = {
        limit: mockLimit,
        orderBy: mockOrderBy,
        then: (resolve: (value: { count: number }[]) => void) => resolve([{ count: 2 }]), // Mock count result (default)
      };

      mockWhere.mockReturnValue(thenableWhereResult as unknown as ReturnType<typeof mockWhere>);

      // But `rowsQuery` doesn't await `where`. It calls `orderBy`.
      // `orderBy` is on the object.

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
      // Our mock count returns 2
      expect(result.totalCount).toBe(2);

      expect(mockLimit).toHaveBeenCalledWith(10);
      expect(mockOffset).toHaveBeenCalledWith(0);
      expect(mockOrderBy).toHaveBeenCalled(); // Ensure sorting is applied
      expect(db.select).toHaveBeenCalledTimes(2); // Rows + Count
    });
  });
});
