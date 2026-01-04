import { IArticleRepository, ArticleSearchCriteria } from '@/domain/article/IArticleRepository';
import { ArticleSummaryDto, PagedResponse } from '@/domain/article/ArticleDto';
import { Article } from '@/domain/article/Article';

/**
 * ListArticlesUseCase
 * 汎用的な記事一覧取得（条件検索含む）
 */
export class ListArticlesUseCase {
    constructor(private readonly articleRepository: IArticleRepository) { }

    async execute(criteria: ArticleSearchCriteria): Promise<PagedResponse<ArticleSummaryDto>> {
        const pagedArticles = await this.articleRepository.findMany(criteria);

        const items = pagedArticles.items.map(this.toSummaryDto);

        return {
            items,
            totalCount: pagedArticles.totalCount,
            hasNextPage: pagedArticles.hasNextPage,
            nextCursor: pagedArticles.nextCursor,
        };
    }

    private toSummaryDto(article: Article): ArticleSummaryDto {
        return {
            id: article.id,
            slug: article.slug,
            lang: article.lang,
            status: article.status,
            category: article.category,
            isFeatured: article.isFeatured,
            publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
            thumbnail: article.thumbnail,

            // Flattened Metadata
            title: article.metadata.title,
            displayTitle: article.metadata.displayTitle,
            composerName: article.metadata.composerName,
            workTitle: article.metadata.workTitle,
            excerpt: article.metadata.excerpt,

            // Metrics
            viewCount: article.engagementMetrics.viewCount,
        };
    }
}
