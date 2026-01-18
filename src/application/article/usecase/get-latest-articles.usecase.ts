import { ArticleRepository } from '@/domain/article/article.repository';
import { ArticleMetadataDto } from '@/application/article/dto/article.dto';
import { ArticleSortOption, SortDirection } from '@/domain/article/article.constants';
import { ArticleStatus } from '@/domain/article/article.control';
import { Article } from '@/domain/article/article';

export interface GetLatestArticlesInput {
  lang: string;
  limit?: number;
  offset?: number;
}

/**
 * GetLatestArticlesUseCase
 * 新着記事を取得するユースケース
 * トップページやサイドバーでの表示に使用します。
 */
export class GetLatestArticlesUseCase {
  constructor(private readonly articleRepository: ArticleRepository) {}

  async execute(input: GetLatestArticlesInput): Promise<ArticleMetadataDto[]> {
    const { lang, limit = 10, offset = 0 } = input;

    const response = await this.articleRepository.findMany({
      filter: {
        lang,
        status: [ArticleStatus.PUBLISHED],
      },
      sort: {
        field: ArticleSortOption.PUBLISHED_AT,
        direction: SortDirection.DESC,
      },
      pagination: {
        limit,
        offset,
      },
    });

    return response.items.map((article) => this.toDto(article));
  }

  private toDto(article: Article): ArticleMetadataDto {
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
