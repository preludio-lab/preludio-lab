import { ArticleRepository } from '@/domain/article/article.repository';
import { ArticleCardDto } from '@/application/article/dto/article-list.dto';
import { ArticleSortOption, SortDirection } from '@/domain/article/article.constants';
import { ArticleStatus } from '@/domain/article/article.control';
import { Article } from '@/domain/article/article';
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

    // 検索条件の構築
    // 1. 作曲家が同じ記事を探す (Worksの場合)
    // let composerName: string | undefined;
    // if (sourceCategory === ArticleCategory.WORKS && sourceArticle.metadata.composerName) {
    //   composerName = sourceArticle.metadata.composerName;
    // }

    // クエリ実行
    // composerNameがある場合は「同一作曲家の作品」を優先検索
    // そうでなければ「同一カテゴリの最新記事」を表示
    const response = await this.articleRepository.findMany({
      filter: {
        lang,
        status: [ArticleStatus.PUBLISHED],
        category: sourceCategory,
        // TODO: RepositoryがcomposerNameフィルタに対応したら追加
        // composerName: composerName,
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
    return related.map((article) => this.toDto(article));
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
