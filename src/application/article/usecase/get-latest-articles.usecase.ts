import { ArticleRepository } from '@/domain/article/article.repository';
import { ArticleCardDto } from '@/application/article/dto/article-list.dto';
import { ArticleSortOption, SortDirection } from '@/domain/article/article.constants';
import { ArticleStatus } from '@/domain/article/article.control';
import { ArticleSummary } from '@/domain/article/article';

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

    const response = await this.articleRepository.search({
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

    return response.items.map((summary) => this.toDto(summary));
  }

  private toDto(summary: ArticleSummary): ArticleCardDto {
    return {
      id: summary.control.id,
      masterId: summary.control.masterId,
      lang: summary.control.lang,
      slug: summary.metadata.slug,
      category: summary.metadata.category,
      title: summary.metadata.title,
      displayTitle: summary.metadata.displayTitle,
      composerName: summary.metadata.composerName,
      workTitle: summary.metadata.workTitle,
      excerpt: summary.metadata.excerpt,
      thumbnail: summary.metadata.thumbnail,
      readingTimeSeconds: summary.metadata.readingTimeSeconds,
      publishedAt: summary.metadata.publishedAt ? summary.metadata.publishedAt.toISOString() : null,
      viewCount: summary.engagement.metrics.viewCount,
      likeCount: summary.engagement.metrics.likeCount,
      tags: summary.metadata.tags,
      readingLevel: summary.metadata.readingLevel,
      performanceDifficulty: summary.metadata.performanceDifficulty,
      playback: summary.metadata.playback,
    };
  }
}
