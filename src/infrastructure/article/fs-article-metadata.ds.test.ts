import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FsArticleMetadataDataSource } from './fs-article-metadata.ds';
import fs from 'fs';
import path from 'path';
import { ArticleCategory } from '@/domain/article/article.metadata';
import { ArticleStatus } from '@/domain/article/article.control';

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

describe('FsArticleMetadataDataSource', () => {
  let dataSource: FsArticleMetadataDataSource;
  const mockContentDir = '/mock/content';

  beforeEach(() => {
    dataSource = new FsArticleMetadataDataSource(mockContentDir);
    vi.clearAllMocks();
  });

  describe('findBySlug', () => {
    it('should return MetadataRow when file exists', async () => {
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
## Heading 1
### Heading 1-1
`);

      const result = await dataSource.findBySlug(slug, lang, category);

      expect(result).not.toBeUndefined();
      // Verify Mapping to MetadataRow
      expect(result?.articles.slug).toBe(slug);
      expect(result?.articles.category).toBe(category);
      expect(result?.article_translations.title).toBe('Test Title');
      expect(result?.article_translations.displayTitle).toBe('Display Title');
      expect(result?.article_translations.lang).toBe(lang);
      expect(result?.article_translations.status).toBe(ArticleStatus.PUBLISHED);
      expect(result?.article_translations.mdxPath).toBe(`${lang}/${category}/${slug}`);

      // Verify TOC
      expect(result?.article_translations.contentStructure).toHaveLength(1);
      expect(result?.article_translations.contentStructure[0].heading).toBe('Heading 1');
      expect(result?.article_translations.contentStructure[0].children).toHaveLength(1);
      expect(result?.article_translations.contentStructure[0].children?.[0].heading).toBe(
        'Heading 1-1',
      );
    });

    it('should return undefined when file does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      // findAllContexts relies on readdir, skipping it here for direct slug lookup
      // But if category is NOT provided, it falls back to findAllContexts.
      // Here we provide category for direct lookup path.

      const result = await dataSource.findBySlug('missing', 'en', ArticleCategory.WORKS);

      expect(result).toBeUndefined();
    });
  });

  describe('findMany', () => {
    it('should return rows and totalCount', async () => {
      // Mock directory traversal
      vi.mocked(fs.existsSync).mockImplementation((p: fs.PathLike) => {
        const pStr = p.toString();
        return pStr === mockContentDir || pStr.includes('works');
      });

      vi.mocked(fs.readdirSync).mockImplementation(((p: fs.PathLike) => {
        const pStr = p.toString();
        if (pStr === mockContentDir) return ['en'];
        if (pStr.endsWith('works')) return ['test.mdx'];
        return [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      const result = await dataSource.findMany({
        filter: { lang: 'en' },
        pagination: { limit: 10, offset: 0 },
        sort: { field: 'publishedAt', direction: 'desc' },
      });

      expect(result.rows).toHaveLength(1);
      expect(result.totalCount).toBe(1);
      expect(result.rows[0].articles.slug).toBe('test');
      expect(result.rows[0].article_translations.title).toBe('List Item');
    });

    it('should return empty list if root dir does not exist', async () => {
      vi.mocked(fs.existsSync).mockReturnValue(false);
      const result = await dataSource.findMany({
        filter: { lang: 'en' },
        pagination: { limit: 10, offset: 0 },
      });
      expect(result.rows).toEqual([]);
      expect(result.totalCount).toBe(0);
    });
  });
});
