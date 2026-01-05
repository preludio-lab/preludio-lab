import { ArticleRepository } from '@/domain/article/ArticleRepository';
import { ArticleMetadataDto, PagedResponse } from '@/domain/article/ArticleDto';
import { ArticleStatus, ArticleSortOption } from '@/domain/article/ArticleConstants';
import { ListArticlesUseCase } from './ListArticlesUseCase';

/**
 * GetFeaturedArticlesUseCase
 * おすすめ記事（キュレーション）の取得
 */
export class GetFeaturedArticlesUseCase {
    constructor(private readonly articleRepository: ArticleRepository) { }

    async execute(lang: string, limit: number = 6): Promise<PagedResponse<ArticleMetadataDto>> {
        const listUseCase = new ListArticlesUseCase(this.articleRepository);

        return listUseCase.execute({
            lang,
            status: [ArticleStatus.PUBLISHED],
            isFeatured: true,
            limit,
            offset: 0,
            sortBy: ArticleSortOption.PUBLISHED_AT,
        });
    }
}
