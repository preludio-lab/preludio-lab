import { ArticleRepository, ArticleSearchCriteria } from '@/domain/article/article.repository';
import { ArticleListItemDto } from '@/application/article/dto/article-list.dto';
import { PagedResponse } from '@/domain/shared/pagination';
import { Article } from '@/domain/article/article';

/**
 * ListArticlesUseCase
 * 条件に基づいた記事一覧の取得（検索・カテゴリ表示等）
 */
export class ListArticlesUseCase {
  constructor(private readonly articleRepository: ArticleRepository) {}

  async execute(criteria: ArticleSearchCriteria): Promise<PagedResponse<ArticleListItemDto>> {
    const response = await this.articleRepository.findMany(criteria);

    return {
      items: response.items.map((article) => this.toDto(article)),
      totalCount: response.totalCount,
      hasNextPage: response.hasNextPage,
    };
  }

  private toDto(article: Article): ArticleListItemDto {
    return {
      // Control Info (flattened)
      id: article.control.id,
      lang: article.control.lang,
      status: article.control.status,

      // Metadata Info (flattened)
      ...article.metadata,
      publishedAt: article.metadata.publishedAt ? article.metadata.publishedAt.toISOString() : null,

      // Engagement Summary
      viewCount: article.engagement.metrics.viewCount,
      auditionCount: article.engagement.metrics.auditionCount,
      likeCount: article.engagement.metrics.likeCount,
      resonanceCount: article.engagement.metrics.resonanceCount,
      shareCount: article.engagement.metrics.shareCount,
    };
  }
}
