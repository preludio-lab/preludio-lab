import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import { FsArticleRepository } from './fs-article.repository';
import { FsArticleMetadataDataSource } from './fs-article-metadata.ds';
import { FsArticleContentDataSource } from './fs-article-content.ds';
import { ArticleCategory } from '@/domain/article/ArticleMetadata';
import { ArticleSortOption } from '@/domain/article/ArticleConstants';

// Mock DataSources
vi.mock('./fs-article-metadata.ds');
vi.mock('./fs-article-content.ds');

describe('FsArticleRepository', () => {
  let repository: FsArticleRepository;
  let mockMetadataDS: { findBySlug: Mock; findAll: Mock };
  let mockContentDS: { getContent: Mock };

  // Mock Data
  const validContext = {
    id: 'prelude',
    slug: 'prelude',
    lang: 'en',
    category: ArticleCategory.WORKS,
    status: 'published',
    filePath: '/path/to/works/prelude.mdx',
    metadata: {
      title: 'Prelude 1',
      composerName: 'J.S. Bach',
      readingLevel: 3,
      isFeatured: true,
      tags: ['Piano', 'Baroque'],
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const validBody = `## Introduction\nText body`;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup Mock Instances
    mockMetadataDS = { findBySlug: vi.fn(), findAll: vi.fn() };
    mockContentDS = { getContent: vi.fn() };

    repository = new FsArticleRepository(
      mockMetadataDS as unknown as FsArticleMetadataDataSource,
      mockContentDS as unknown as FsArticleContentDataSource
    );
  });

  describe('findBySlug', () => {
    it('returns article if context exists', async () => {
      mockMetadataDS.findBySlug.mockResolvedValue(validContext);
      mockContentDS.getContent.mockResolvedValue(validBody);

      const result = await repository.findBySlug('en', ArticleCategory.WORKS, 'prelude');

      expect(result).not.toBeNull();
      expect(result?.metadata.title).toBe('Prelude 1');
      expect(result?.metadata.composerName).toBe('J.S. Bach');

      expect(mockMetadataDS.findBySlug).toHaveBeenCalledWith(
        'en',
        ArticleCategory.WORKS,
        'prelude',
      );
      expect(mockContentDS.getContent).toHaveBeenCalledWith('/path/to/works/prelude.mdx');
    });

    it('returns null if validation fails or file missing (DS returns null)', async () => {
      mockMetadataDS.findBySlug.mockResolvedValue(null);
      const result = await repository.findBySlug('en', ArticleCategory.WORKS, 'missing');
      expect(result).toBeNull();
    });
  });

  describe('findMany', () => {
    it('filters articles by criteria', async () => {
      const mockAllContexts = [
        {
          ...validContext,
          id: '1',
          lang: 'en',
          category: ArticleCategory.WORKS,
          metadata: { ...validContext.metadata, tags: ['Piano'] },
        },
        {
          ...validContext,
          id: '2',
          lang: 'en',
          category: ArticleCategory.COMPOSERS,
          metadata: { ...validContext.metadata, tags: ['Baroque'] },
        },
        { ...validContext, id: '3', lang: 'ja', category: ArticleCategory.WORKS },
      ];
      mockMetadataDS.findAll.mockResolvedValue(mockAllContexts);
      mockContentDS.getContent.mockResolvedValue(validBody);

      const result = await repository.findMany({
        lang: 'en',
        category: ArticleCategory.WORKS,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].control.id).toBe('1');
      expect(mockMetadataDS.findAll).toHaveBeenCalled();
    });
  });
});
