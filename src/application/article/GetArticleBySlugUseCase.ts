import { ArticleRepository } from '@/domain/article/ArticleRepository';
import { ArticleDetailDto } from '@/domain/article/ArticleDto';
import { Article } from '@/domain/article/Article';

/**
 * GetArticleBySlugUseCase
 * スラグ（URL）による単一記事の取得（詳細画面用）
 */
export class GetArticleBySlugUseCase {
    constructor(private readonly articleRepository: ArticleRepository) { }

    async execute(lang: string, slug: string): Promise<ArticleDetailDto | null> {
        const article = await this.articleRepository.findBySlug(lang, slug);

        if (!article) {
            return null;
        }

        return this.toDto(article);
    }

    private toDto(article: Article): ArticleDetailDto {
        return {
            id: article.id,
            slug: article.slug,
            lang: article.lang,
            status: article.status,
            category: article.category,
            isFeatured: article.isFeatured,
            publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
            updatedAt: article.updatedAt.toISOString(),
            thumbnail: article.thumbnail,

            metadata: article.metadata,
            engagement: article.engagementMetrics,
            playback: article.playback,
            sourceAttributions: article.sourceAttributions,
            monetizationElements: article.monetizationElements,

            content: article.content,
            contentStructure: article.contentStructure,

            seriesAssignments: article.seriesAssignments.map(sa => ({
                seriesId: sa.seriesId,
                seriesSlug: sa.seriesSlug,
                seriesTitle: sa.seriesTitle,
                order: sa.order
            }))
        };
    }
}
