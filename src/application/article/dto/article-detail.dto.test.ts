import { describe, it, expect } from 'vitest';
import { ArticleDtoSchema } from './article-detail.dto';
import { ArticleCategory } from '@/domain/article/article.metadata';

describe('ArticleDtoSchema', () => {
  const validData = {
    control: {
      id: 'article-123',
      lang: 'ja',
      status: 'published',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-02T00:00:00Z',
    },
    metadata: {
      title: 'ベートーヴェン：交響曲第5番',
      displayTitle: '交響曲 第5番 ハ短調 作品67「運命」',
      slug: 'beethoven-symphony-5',
      category: ArticleCategory.WORKS,
      composerName: 'Ludwig van Beethoven',
      workTitle: 'Symphony No. 5',
      isFeatured: true,
      readingTimeSeconds: 300,
      publishedAt: '2026-01-01T00:00:00Z',
      tags: ['classic', 'orchestra'],
      // Missing required fields might cause error, strictly checking Schema
      thumbnail: 'https://example.com/thumb.jpg',
      readingLevel: 3,
      performanceDifficulty: 4,
    },
    content: {
      body: '# 概要\n運命が扉を叩く...',
      structure: [{ id: 'intro', heading: '導入', level: 2 }],
    },
    context: {
      seriesAssignments: [],
      relatedArticles: [],
      sourceAttributions: [{ title: 'IMSLP', url: 'https://imslp.org' }],
      monetizationElements: [],
    },
    engagement: {
      metrics: {
        viewCount: 100,
        auditionCount: 50,
        likeCount: 10,
        resonanceCount: 5,
        shareCount: 2,
        totalTimeOnPageSeconds: 3600,
      },
    },
  };

  it('should validate a complete valid article object', () => {
    const result = ArticleDtoSchema.safeParse(validData);
    if (!result.success) {
      console.error(JSON.stringify(result.error.format(), null, 2));
    }
    expect(result.success).toBe(true);
  });

  it('should fail if a required section is missing', () => {
    const incompleteData = { ...validData } as Partial<typeof validData>;
    delete incompleteData.content;
    const result = ArticleDtoSchema.safeParse(incompleteData);
    expect(result.success).toBe(false);
  });
});
