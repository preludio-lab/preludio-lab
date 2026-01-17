import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { FsArticleRepository } from './fs-article.repository';
import { ArticleCategory } from '@/domain/article/ArticleMetadata';
import { Logger } from '@/shared/logging/logger';
import { MetadataRow } from './interfaces/article-metadata-data-source.interface';
import { ArticleStatus } from '@/domain/article/ArticleControl';

// DataSource Mocks
// Note: We mock the interface methods.
// Since Interfaces are types, we mock the objects passed to constructor.

describe('FsArticleRepository', () => {
  let repository: FsArticleRepository;
  let mockMetadataDS: { findBySlug: Mock; findById: Mock; findMany: Mock };
  let mockContentDS: { getContent: Mock };

  // Mock Data
  const validRow: MetadataRow = {
    articles: {
      id: 'prelude',
      slug: 'prelude',
      category: ArticleCategory.WORKS,
      isFeatured: true,
      readingTimeSeconds: 500,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      workId: null,
      thumbnailPath: null,
    },
    article_translations: {
      id: 'prelude-en',
      articleId: 'prelude',
      lang: 'en',
      status: ArticleStatus.PUBLISHED,
      title: 'Prelude 1',
      displayTitle: 'Prelude 1',
      catchcopy: null,
      excerpt: null,
      publishedAt: new Date().toISOString(),
      isFeatured: true,
      mdxPath: 'en/works/prelude',
      slSlug: 'prelude',
      slCategory: ArticleCategory.WORKS,
      slComposerName: 'J.S. Bach',
      slWorkCatalogueId: null,
      slWorkNicknames: null,
      slGenre: null,
      slInstrumentations: null,
      slEra: null,
      slNationality: null,
      slKey: null,
      slPerformanceDifficulty: 3,
      slImpressionDimensions: null,
      contentEmbedding: null,
      slSeriesAssignments: [],
      metadata: {} as any, // Mapper relies on this or individual fields? It copies base metadata.
      // Important: Mapper uses `metadata` JSON + fallback to columns.
      // We should populate metadata to be safe or ensure columns are sufficient.
      // Let's populate minimal metadata.
      contentStructure: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };
  // validRow.article_translations.metadata needs to prevent zod parse error in Mapper
  validRow.article_translations.metadata = {
    title: 'Prelude 1',
    slug: 'prelude',
    category: ArticleCategory.WORKS,
    tags: ['Piano'],
  } as any;

  const validBody = `## Introduction\nText body`;

  beforeEach(() => {
    vi.clearAllMocks();

    mockMetadataDS = { findBySlug: vi.fn(), findById: vi.fn(), findMany: vi.fn() };
    mockContentDS = { getContent: vi.fn() };

    const mockLogger = {
      debug: vi.fn(),
      info: vi.fn(),
      warn: vi.fn(),
      error: vi.fn(),
    };

    repository = new FsArticleRepository(
      mockMetadataDS as any,
      mockContentDS as any,
      mockLogger as any,
    );
  });

  describe('findBySlug', () => {
    it('returns article if row exists', async () => {
      mockMetadataDS.findBySlug.mockResolvedValue(validRow);
      mockContentDS.getContent.mockResolvedValue(validBody);

      const result = await repository.findBySlug('en', ArticleCategory.WORKS, 'prelude');

      expect(result).not.toBeNull();
      expect(result?.metadata.title).toBe('Prelude 1');
      expect(result?.metadata.composerName).toBe('J.S. Bach');

      // Check if content was loaded using mdxPath + .mdx
      expect(mockContentDS.getContent).toHaveBeenCalledWith('en/works/prelude.mdx');

      // Check TOC extraction (logic inside repo)
      expect(result?.content.structure).toHaveLength(1);
      expect(result?.content.structure[0].heading).toBe('Introduction');
    });

    it('returns null if DS returns undefined', async () => {
      mockMetadataDS.findBySlug.mockResolvedValue(undefined);
      const result = await repository.findBySlug('en', ArticleCategory.WORKS, 'missing');
      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    it('returns article if row exists', async () => {
      mockMetadataDS.findById.mockResolvedValue(validRow);
      mockContentDS.getContent.mockResolvedValue(validBody);

      const result = await repository.findById('prelude', 'en');
      expect(result).not.toBeNull();
      expect(result?.control.id).toBe('prelude');
    });
  });

  describe('findMany', () => {
    it('filters articles by criteria', async () => {
      mockMetadataDS.findMany.mockResolvedValue({
        rows: [validRow],
        totalCount: 1,
      });

      const result = await repository.findMany({
        filter: { lang: 'en' },
        pagination: { limit: 10, offset: 0 },
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].control.id).toBe('prelude');

      // findMany should NOT load content (optimistic) -> content.body is null
      // But verify mapper works with null content
      expect(result.items[0].content.body).toBeNull();
    });
  });
});
