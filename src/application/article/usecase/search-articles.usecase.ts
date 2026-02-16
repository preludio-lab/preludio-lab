import { ArticleRepository, ArticleSearchCriteria } from '@/domain/article/article.repository';
import {
  ArticleSearchResultListDto,
  ArticleSearchResultItemDto,
} from '@/application/article/dto/article-search.dto';

import { ArticleSummary } from '@/domain/article/article';

/**
 * SearchArticlesUseCase
 * 複合条件による記事検索（スコア付き）
 */
export class SearchArticlesUseCase {
  constructor(private readonly articleRepository: ArticleRepository) {}

  async execute(criteria: ArticleSearchCriteria): Promise<ArticleSearchResultListDto> {
    const pagedArticles = await this.articleRepository.search(criteria);

    const items = pagedArticles.items.map((summary) => this.toSearchResultItemDto(summary));

    return {
      items,
      totalCount: pagedArticles.totalCount,
      hasNextPage: pagedArticles.hasNextPage,
      nextCursor: pagedArticles.nextCursor ?? null,
    };
  }

  private toSearchResultItemDto(summary: ArticleSummary): ArticleSearchResultItemDto {
    return {
      article: {
        // Control Info
        id: summary.control.id,
        masterId: summary.control.masterId,
        lang: summary.control.lang,
        status: summary.control.status,

        // Metadata Info
        ...summary.metadata,
        publishedAt: summary.metadata.publishedAt
          ? summary.metadata.publishedAt.toISOString()
          : null,

        // Engagement Summary
        viewCount: summary.engagement.metrics.viewCount,
        auditionCount: summary.engagement.metrics.auditionCount,
        likeCount: summary.engagement.metrics.likeCount,
        resonanceCount: summary.engagement.metrics.resonanceCount,
        shareCount: summary.engagement.metrics.shareCount,
      },
      search: {
        // Mock score, assuming strict order from repository
        matchScore: 1.0,
      },
    };
  }
}
