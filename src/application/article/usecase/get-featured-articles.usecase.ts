import { ArticleRepository } from '@/domain/article/article.repository';
import { ArticleMetadataDto } from '@/application/article/dto/article.dto';
import { PagedResponse } from '@/domain/shared/pagination';
import { ArticleStatus } from '@/domain/article/article.control';
import { ArticleSortOption, SortDirection } from '@/domain/article/article.constants';
import { ListArticlesUseCase } from './list-articles.usecase';

/**
 * GetFeaturedArticlesUseCase
 * おすすめ記事（キュレーション）の取得
 */
export class GetFeaturedArticlesUseCase {
  constructor(private readonly articleRepository: ArticleRepository) {}

  async execute(lang: string, limit: number = 6): Promise<PagedResponse<ArticleMetadataDto>> {
    const listUseCase = new ListArticlesUseCase(this.articleRepository);

    return listUseCase.execute({
      filter: {
        lang,
        status: [ArticleStatus.PUBLISHED],
        isFeatured: true,
      },
      pagination: {
        limit,
        offset: 0,
      },
      sort: {
        field: ArticleSortOption.PUBLISHED_AT,
        direction: SortDirection.DESC,
      },
    });
  }
}
