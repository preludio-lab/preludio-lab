import { IArticleRepository } from '@/domain/article/IArticleRepository';
import { Article } from '@/domain/article/Article';
import { ArticleMetadata } from '@/domain/article/ArticleMetadata';
import { ArticleStatus, ArticleCategory } from '@/domain/article/ArticleConstants';
import { INITIAL_ENGAGEMENT_METRICS } from '@/domain/article/EngagementMetrics';

export interface CreateArticleCommand {
    slug: string;
    lang: string;
    category: ArticleCategory;
    title: string;
    composerName: string;
    content: string;
}

/**
 * CreateArticleUseCase
 * 新規記事作成
 */
export class CreateArticleUseCase {
    constructor(private readonly articleRepository: IArticleRepository) { }

    async execute(command: CreateArticleCommand): Promise<string> {
        // Check if exists
        const existing = await this.articleRepository.findBySlug(command.lang, command.slug);
        if (existing) {
            throw new Error(`Article with slug ${command.slug} already exists.`);
        }

        // Default Metadata
        const metadata: ArticleMetadata = {
            title: command.title,
            displayTitle: command.title,
            composerName: command.composerName,
            tags: []
            // other optionals undefined
        };

        const article = new Article({
            id: command.slug, // ID generation strategy (use slug for FS)
            slug: command.slug,
            lang: command.lang,
            status: ArticleStatus.DRAFT,
            category: command.category,
            metadata,
            content: command.content,
            isFeatured: false,
            engagementMetrics: INITIAL_ENGAGEMENT_METRICS
        });

        await this.articleRepository.save(article);

        return article.id;
    }
}
