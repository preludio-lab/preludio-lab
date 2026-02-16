import { ArticleRepository } from '@/domain/article/article.repository';
import { ArticleCardDto } from '@/application/article/dto/article-list.dto';
import { ArticleSortOption, SortDirection } from '@/domain/article/article.constants';
import { ArticleStatus } from '@/domain/article/article.control';
import { ArticleSummary } from '@/domain/article/article';
import { ArticleCategory } from '@/domain/article/article.metadata';

export interface GetRelatedArticlesInput {
  lang: string;
  sourceSlug: string;
  sourceCategory: ArticleCategory;
  limit?: number;
}

/**
 * GetRelatedArticlesUseCase
 * 関連記事を取得するユースケース
 *
 * ロジック:
 * 1. 同一作曲家の他の作品 (Priority High)
 * 2. 同一カテゴリの他の記事 (Priority Medium)
 * 3. シャッフルはせず、最新または関連性の高い順にソート
 *
 * 将来的にはここでVector Searchを使用した「意味的類似度」による検索を行う。
 */
export class GetRelatedArticlesUseCase {
  constructor(private readonly articleRepository: ArticleRepository) {}

  async execute(input: GetRelatedArticlesInput): Promise<ArticleCardDto[]> {
    const { lang, sourceSlug, sourceCategory, limit = 4 } = input;

    // 現在の記事を取得して、コンテキスト（作曲家IDなど）を確認したいところだが、
    // ここでは簡易的に「同一カテゴリ・他記事」を取得する実装とする。
    // 理想的には、sourceSlugから記事詳細を取得し、そのcomposerNameを使って検索する。

    const sourceArticle = await this.articleRepository.findBySlug(lang, sourceCategory, sourceSlug);

    if (!sourceArticle) {
      return [];
    }

    // クエリ実行
    // composerNameがある場合は「同一作曲家の作品」を優先検索
    // そうでなければ「同一カテゴリの最新記事」を表示
    const response = await this.articleRepository.search({
      filter: {
        lang,
        status: [ArticleStatus.PUBLISHED],
        category: sourceCategory,
      },
      sort: {
        field: ArticleSortOption.PUBLISHED_AT,
        direction: SortDirection.DESC,
      },
      pagination: {
        limit: limit + 1, // 自分自身が含まれる可能性を考慮して多めに取得
        offset: 0,
      },
    });

    // 自分自身を除外
    const related = response.items
      .filter((item) => item.metadata.slug !== sourceSlug)
      .slice(0, limit);

    // DTOへ変換
    return related.map((summary) => this.toDto(summary));
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
