import { describe, it, expect } from 'vitest';
import { ArticleSearchResultItemDtoSchema } from './search-articles.dto';
import { ArticleCategory } from '@/domain/article/article.metadata';

describe('ArticleSearchResultItemDtoSchema', () => {
  const validMetadata = {
    id: '018f3a3a-3a3a-7a3a-a3a3-a3a3a3a3a3a3',
    masterId: '018f3a3a-3a3a-7a3a-a3a3-a3a3a3a3a3a2',
    slug: 'beethoven-symphony-5',
    lang: 'ja',
    status: 'published',
    title: 'ベートーヴェン：交響曲第5番',
    displayTitle: '交響曲 第5番 ハ短調 作品67「運命」',
    category: ArticleCategory.WORKS,
    isFeatured: true,
    publishedAt: '2026-01-01T00:00:00Z',
    composerName: 'Ludwig van Beethoven',
    readingTimeSeconds: 300,
    viewCount: 100,
    auditionCount: 50,
    resonanceCount: 30,
    shareCount: 10,
    // Add fields required by ArticleCardDto/Summary which might be part of SearchResultItem
    thumbnail: 'https://example.com/thumb.jpg',
    workTitle: 'Symphony No. 5',
    likeCount: 10,
  };

  const validSearchResult = {
    article: validMetadata,
    search: {
      matchScore: 0.95,
      highlightedText: '交響曲第5番',
    },
  };

  it('should validate a valid search result item (composition)', () => {
    // Note: strict validation depeneds on the schema definition.
    // If the schema expects EXACT matches, we need to ensure validMetadata has all props.
    // For now, testing basic structure.
    const result = ArticleSearchResultItemDtoSchema.safeParse(validSearchResult);
    expect(
      result.success,
      result.success ? undefined : JSON.stringify(result.error.format(), null, 2),
    ).toBe(true);
  });

  it('should fail if search context is missing', () => {
    const invalidData = { article: validMetadata };
    const result = ArticleSearchResultItemDtoSchema.safeParse(invalidData);
    expect(result.success).toBe(false);
  });
});
