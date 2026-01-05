import { ArticleRepository } from '@/domain/article/ArticleRepository';
import { ArticleDto } from '@/domain/article/ArticleDto';
import { Article } from '@/domain/article/Article';

/**
 * GetArticleBySlugUseCase
 * スラグ（URL）による単一記事の取得（詳細画面用）
 */
export class GetArticleBySlugUseCase {
    constructor(private readonly articleRepository: ArticleRepository) { }

    async execute(lang: string, slug: string): Promise<ArticleDto | null> {
        const article = await this.articleRepository.findBySlug(lang, slug);

        if (!article) {
            return null;
        }

        return this.toDto(article);
    }

    private toDto(article: Article): ArticleDto {
        return {
            ...article.metadata,
            id: article.control.id,
            lang: article.control.lang,
            status: article.control.status,
            publishedAt: article.publishedAt ? article.publishedAt.toISOString() : null,
            updatedAt: article.control.updatedAt.toISOString(),

            metadata: article.metadata,
            engagement: article.engagement.metrics,
            playback: article.metadata.playback,
            sourceAttributions: article.context.sourceAttributions,
            monetizationElements: article.context.monetizationElements,

            body: article.content.body,
            structure: article.content.structure,

            seriesAssignments: article.context.seriesAssignments,
            relatedArticles: article.context.relatedArticles,
        };
    }
}
