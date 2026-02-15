import { ArticleRepository, ArticleSearchCriteria } from '@/domain/article/article.repository';
import { ArticleListItemDto } from '@/application/article/dto/article-list.dto';
import { PagedResponse } from '@/domain/shared/pagination';
import { ArticleSummary } from '@/domain/article/article';

/**
 * ListArticlesUseCase
 * 条件に基づいた記事一覧の取得（検索・カテゴリ表示等）
 */
export class ListArticlesUseCase {
  constructor(private readonly articleRepository: ArticleRepository) {}

  async execute(criteria: ArticleSearchCriteria): Promise<PagedResponse<ArticleListItemDto>> {
    const response = await this.articleRepository.search(criteria);

    return {
      items: response.items.map((summary) => this.toDto(summary)),
      totalCount: response.totalCount,
      hasNextPage: response.hasNextPage,
    };
  }

  private toDto(summary: ArticleSummary): ArticleListItemDto {
    return {
      // Control Info (flattened)
      id: summary.control.id,
      masterId: summary.control.masterId,
      lang: summary.control.lang,
      status: summary.control.status,

      // Metadata Info (flattened)
      ...summary.metadata,
      publishedAt: summary.metadata.publishedAt ? summary.metadata.publishedAt.toISOString() : null,

      // Engagement Summary
      viewCount: summary.engagement.metrics.viewCount,
      auditionCount: summary.engagement.metrics.auditionCount,
      likeCount: summary.engagement.metrics.likeCount,
      resonanceCount: summary.engagement.metrics.resonanceCount,
      shareCount: summary.engagement.metrics.shareCount,
    };
  }
}
