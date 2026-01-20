import { ArticleRepository, ArticleSearchCriteria } from '@/domain/article/article.repository';
import {
  ArticleSearchResultListDto,
  ArticleSearchResultItemDto,
} from '@/application/article/dto/article-search.dto';

import { Article } from '@/domain/article/article';

/**
 * SearchArticlesUseCase
 * 複合条件による記事検索（スコア付き）
 */
export class SearchArticlesUseCase {
  constructor(private readonly articleRepository: ArticleRepository) {}

  async execute(criteria: ArticleSearchCriteria): Promise<ArticleSearchResultListDto> {
    const pagedArticles = await this.articleRepository.findMany(criteria);

    const items = pagedArticles.items.map(this.toSearchResultItemDto);

    return {
      items,
      totalCount: pagedArticles.totalCount,
      hasNextPage: pagedArticles.hasNextPage,
      nextCursor: pagedArticles.nextCursor ?? null,
    };
  }

  private toSearchResultItemDto(article: Article): ArticleSearchResultItemDto {
    return {
      article: {
        // Control Info
        id: article.control.id,
        lang: article.control.lang,
        status: article.control.status,

        // Metadata Info
        ...article.metadata,
        publishedAt: article.metadata.publishedAt
          ? article.metadata.publishedAt.toISOString()
          : null,

        // Engagement Summary
        viewCount: article.engagement.metrics.viewCount,
        auditionCount: article.engagement.metrics.auditionCount,
        likeCount: article.engagement.metrics.likeCount,
        resonanceCount: article.engagement.metrics.resonanceCount,
        shareCount: article.engagement.metrics.shareCount,
      },
      search: {
        // Mock score, assuming strict order from repository
        matchScore: 1.0,
      },
    };
  }
}
