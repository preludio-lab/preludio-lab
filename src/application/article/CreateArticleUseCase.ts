import { ArticleRepository } from '@/domain/article/ArticleRepository';
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
    constructor(private readonly articleRepository: ArticleRepository) { }

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
            tags: [],
            sourceAttributions: [],
            monetizationElements: [],
            slug: command.slug,
            category: command.category,
            isFeatured: false,
            readingTimeSeconds: 0,
        };

        const article = new Article({
            control: {
                id: command.slug, // ID generation strategy (use slug for FS)
                lang: command.lang as any,
                status: ArticleStatus.DRAFT,
                createdAt: new Date(),
                updatedAt: new Date(),
                publishedAt: null,
            },
            metadata,
            content: {
                body: command.content,
                structure: [],
            }
        });

        await this.articleRepository.save(article);

        return article.id;
    }
}
