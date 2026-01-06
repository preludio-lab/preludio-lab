import { ArticleRepository, ArticleSearchCriteria } from '@/domain/article/ArticleRepository';
import { ArticleSearchResultDto, PagedResponse } from '@/domain/article/ArticleDto';
import { Article } from '@/domain/article/Article';

/**
 * SearchArticlesUseCase
 * 複合条件による記事検索（スコア付き）
 */
export class SearchArticlesUseCase {
    constructor(private readonly articleRepository: ArticleRepository) { }

    async execute(criteria: ArticleSearchCriteria): Promise<PagedResponse<ArticleSearchResultDto>> {
        const pagedArticles = await this.articleRepository.findMany(criteria);

        const items = pagedArticles.items.map(this.toSearchResultDto);

        return {
            items,
            totalCount: pagedArticles.totalCount,
            hasNextPage: pagedArticles.hasNextPage,
            nextCursor: pagedArticles.nextCursor,
        };
    }

    private toSearchResultDto(article: Article): ArticleSearchResultDto {
        return {
            // Control Info
            id: article.control.id,
            lang: article.control.lang,
            status: article.control.status,

            // Metadata Info
            ...article.metadata,
            publishedAt: article.metadata.publishedAt ? article.metadata.publishedAt.toISOString() : null,

            // Engagement Summary
            viewCount: article.engagement.metrics.viewCount,

            // Search Specific
            matchScore: 1.0, // Mock score for FS
        };
    }
}
