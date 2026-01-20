import { ArticleRepository } from '@/domain/article/article.repository';
import { ArticleCardDto } from '@/application/article/dto/article-list.dto';
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

  async execute(input: GetLatestArticlesInput): Promise<ArticleCardDto[]> {
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

  private toDto(article: Article): ArticleCardDto {
    return {
      id: article.control.id,
      lang: article.control.lang,
      slug: article.metadata.slug,
      category: article.metadata.category,
      title: article.metadata.title,
      displayTitle: article.metadata.displayTitle,
      composerName: article.metadata.composerName,
      workTitle: article.metadata.workTitle,
      excerpt: article.metadata.excerpt,
      thumbnail: article.metadata.thumbnail,
      readingTimeSeconds: article.metadata.readingTimeSeconds,
      publishedAt: article.metadata.publishedAt ? article.metadata.publishedAt.toISOString() : null,
      viewCount: article.engagement.metrics.viewCount,
      likeCount: article.engagement.metrics.likeCount,
      tags: article.metadata.tags,
      readingLevel: article.metadata.readingLevel,
      performanceDifficulty: article.metadata.performanceDifficulty,
      playback: article.metadata.playback,
    };
  }
}
