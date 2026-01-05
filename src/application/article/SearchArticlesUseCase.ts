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
        // In FS implementation, we don't have vector search scores.
        // Default score to 1.0 or undefined.
        return {
            id: article.id,
            slug: article.slug,
            lang: article.lang,
            status: article.status,
            category: article.category,
            isFeatured: article.isFeatured,
            publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
            thumbnail: article.thumbnail,

            title: article.metadata.title,
            displayTitle: article.metadata.displayTitle,
            composerName: article.metadata.composerName,
            workTitle: article.metadata.workTitle,
            excerpt: article.metadata.excerpt,

            viewCount: article.engagementMetrics.viewCount,

            matchScore: 1.0, // Mock score for FS
        };
    }
}
