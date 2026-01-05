import { ArticleRepository, ArticleSearchCriteria } from '@/domain/article/ArticleRepository';
import { ArticleMetadataDto, PagedResponse } from '@/domain/article/ArticleDto';
import { Article } from '@/domain/article/Article';

/**
 * ListArticlesUseCase
 * 条件に基づいた記事一覧の取得（検索・カテゴリ表示等）
 */
export class ListArticlesUseCase {
    constructor(private readonly articleRepository: ArticleRepository) { }

    async execute(criteria: ArticleSearchCriteria): Promise<PagedResponse<ArticleMetadataDto>> {
        const response = await this.articleRepository.findMany(criteria);

        return {
            items: response.items.map(article => this.toDto(article)),
            totalCount: response.totalCount,
            hasNextPage: response.hasNextPage
        };
    }

    private toDto(article: Article): ArticleMetadataDto {
        return {
            id: article.id,
            slug: article.slug,
            lang: article.lang,
            status: article.status,
            category: article.category,
            isFeatured: article.isFeatured,
            publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
            thumbnail: article.thumbnail,

            // Flattened
            title: article.metadata.title,
            displayTitle: article.metadata.displayTitle,
            composerName: article.metadata.composerName,
            workTitle: article.metadata.workTitle,
            excerpt: article.metadata.excerpt,

            // UX
            readingTimeSeconds: article.readingTimeSeconds,
            engagement: {
                viewCount: article.engagementMetrics.viewCount,
                likeCount: article.engagementMetrics.likeCount,
            }
        };
    }
}
