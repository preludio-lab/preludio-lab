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
            control: {
                id: article.control.id,
                lang: article.control.lang as any,
                status: article.control.status,
                createdAt: article.control.createdAt,
                updatedAt: article.control.updatedAt,
            },
            metadata: article.metadata,
            content: article.content,
            context: article.context,
            engagement: article.engagement.metrics,
        };
    }
}
