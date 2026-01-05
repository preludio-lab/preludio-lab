import { ArticleRepository, ArticleSearchCriteria } from '@/domain/article/ArticleRepository';
import { ArticleSummaryDto, PagedResponse } from '@/domain/article/ArticleDto';
import { ArticleStatus, ArticleSortOption } from '@/domain/article/ArticleConstants';
import { ListArticlesUseCase } from './ListArticlesUseCase';

/**
 * GetFeaturedArticlesUseCase
 * おすすめ記事（キュレーション）の取得
 */
export class GetFeaturedArticlesUseCase {
    constructor(private readonly articleRepository: ArticleRepository) { }

    async execute(lang: string, limit: number = 6): Promise<PagedResponse<ArticleSummaryDto>> {
        // Reuse Repository Logic
        // In strict Clean Architecture, we might duplicate the DTO mapping or reuse a shared mapper.
        // For simplicity, we use the same repository method but constructing specific criteria.

        // However, ListArticlesUseCase has the DTO mapping logic. 
        // We can either compose ListArticlesUseCase or duplicate mapping.
        // Composition is cleaner if the logic is strictly "List with specific filter".

        // Here I will use repository directly to avoid creating instance of usecase inside usecase (though possible).
        const listUseCase = new ListArticlesUseCase(this.articleRepository);

        return listUseCase.execute({
            lang,
            status: [ArticleStatus.PUBLISHED],
            isFeatured: true,
            limit,
            offset: 0,
            sortBy: ArticleSortOption.PUBLISHED_AT,
            // We might want specific sort for featured (e.g. Featured Date), 
            // but current entity doesn't have it. Use PublishedAt or Trending.
        });

        // Actually, I need to filter by `isFeatured` in criteria.
        // But `ArticleSearchCriteria` doesn't have `isFeatured` field explicitly in the interface I defined earlier!
        // I missed adding `isFeatured` to `ArticleSearchCriteria` in `ArticleRepository.ts`.
        // I should check `ArticleRepository.ts`.
    }
}
