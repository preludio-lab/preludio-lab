import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FsArticleMetadataDataSource } from './fs-article-metadata.ds';
import fs from 'fs';
import path from 'path';
import { ArticleCategory } from '@/domain/article/ArticleMetadata';
import { ArticleStatus } from '@/domain/article/ArticleControl';

// fs モジュールのモック
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    readdirSync: vi.fn(),
    statSync: vi.fn(),
    promises: {
      readFile: vi.fn(),
    },
  },
}));

// gray-matter は内部実装詳細に近いため、モック化せず統合的にテストするか、
// あるいは fs.readFileSync の戻り値を制御して間接的にテストします。
// ここでは fs をモックして gray-matter がパースできる文字列を返すようにします。

describe('FsArticleMetadataDataSource', () => {
  let dataSource: FsArticleMetadataDataSource;
  const mockContentDir = '/mock/content';

  beforeEach(() => {
    dataSource = new FsArticleMetadataDataSource(mockContentDir);
    vi.clearAllMocks();
  });

  describe('findBySlug', () => {
    it('should return context when file exists', async () => {
      const lang = 'en';
      const category = ArticleCategory.WORKS;
      const slug = 'test-slug';
      const filePath = path.join(mockContentDir, lang, category, `${slug}.mdx`);

      vi.mocked(fs.existsSync).mockReturnValue(true);
      vi.mocked(fs.statSync).mockReturnValue({ mtime: new Date() } as fs.Stats);
      vi.mocked(fs.readFileSync).mockReturnValue(`---
title: Test Title
displayTitle: Display Title
composer: Bach
category: ${category}
date: 2023-01-01
status: published
---
`);

      const result = await dataSource.findBySlug(lang, category, slug);

      expect(result).not.toBeNull();
      expect(result?.slug).toBe(slug);
      expect(result?.metadata.title).toBe('Test Title');
      // displayTitleの確認
      expect(result?.metadata.displayTitle).toBe('Display Title');
      // categoryが正しくパースされているか
      expect(result?.category).toBe(category);
      expect(result?.status).toBe(ArticleStatus.PUBLISHED);
    });

    it('should return null when file does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);

      const result = await dataSource.findBySlug('en', ArticleCategory.WORKS, 'missing');

      expect(result).toBeNull();
    });

    it('should handle legacy metadata mapping', async () => {
      const lang = 'ja';
      const category = ArticleCategory.WORKS;
      const slug = 'legacy-slug';

      (fs.existsSync as any).mockReturnValue(true);
      (fs.statSync as any).mockReturnValue({ mtime: new Date() });
      // 必須フィールドが一部欠けているなど、バリデーション落ちするがマッピング可能なデータ
      (fs.readFileSync as any).mockReturnValue(`---
title: Legacy Title
difficulty: Beginner
composer: Unknown
date: 2022-01-01
---
`);

      const result = await dataSource.findBySlug(lang, category, slug);

      expect(result).not.toBeNull();
      expect(result?.metadata.title).toBe('Legacy Title');
      expect(result?.metadata.readingLevel).toBe(1); // Beginner -> 1
      expect(result?.metadata.composerName).toBe('Unknown');
    });
  });

  describe('findAll', () => {
    it('should return list of contexts', async () => {
      // Mock directory structure traversal
      // 1. fs.existsSync(root) -> true
      // 2. fs.readdirSync(root) -> ['en']
      // 3. fs.statSync -> isDirectory
      // 4. Loop categories
      // 5. fs.existsSync(dirPath) -> true (mock one category)
      // 6. fs.readdirSync(dirPath) -> ['test.mdx']
      // 7. fs.readFileSync -> content

      vi.mocked(fs.existsSync).mockImplementation((p: fs.PathLike) => {
        const pStr = p.toString();
        return pStr === mockContentDir || pStr.includes('works');
      });

      vi.mocked(fs.readdirSync).mockImplementation(((p: fs.PathLike) => {
        const pStr = p.toString();
        if (pStr === mockContentDir) return ['en'];
        if (pStr.endsWith('works')) return ['test.mdx'];
        return [];
      }) as any);

      vi.mocked(fs.statSync).mockImplementation((p: fs.PathLike) => {
        const pStr = p.toString();
        if (pStr.endsWith('en')) return { isDirectory: () => true } as fs.Stats;
        if (pStr.endsWith('.mdx'))
          return { isDirectory: () => false, mtime: new Date() } as fs.Stats;
        return { isDirectory: () => false } as fs.Stats;
      });

      vi.mocked(fs.readFileSync).mockReturnValue(`---
title: List Item
composer: Bach
category: works
date: 2023-01-01
---
`);

      const results = await dataSource.findAll();

      expect(results).toHaveLength(1);
      expect(results[0].slug).toBe('test');
      expect(results[0].metadata.title).toBe('List Item');
    });

    it('should return empty list if root dir does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const results = await dataSource.findAll();
      expect(results).toEqual([]);
    });
  });
});
