import { IArticleRepository } from '@/domain/article/IArticleRepository';
import { ArticleMetadata } from '@/domain/article/ArticleMetadata';
import { ArticleStatus, ArticleCategory } from '@/domain/article/ArticleConstants';

export interface UpdateArticleCommand {
    id: string; // Slug or ID
    content?: string;
    status?: ArticleStatus;
    isFeatured?: boolean;
    metadata?: Partial<ArticleMetadata>;
}

/**
 * UpdateArticleUseCase
 * 既存記事更新
 */
export class UpdateArticleUseCase {
    constructor(private readonly articleRepository: IArticleRepository) { }

    async execute(command: UpdateArticleCommand): Promise<void> {
        const article = await this.articleRepository.findById(command.id);
        if (!article) {
            throw new Error(`Article not found: ${command.id}`);
        }

        const updatedArticle = article.cloneWith({
            content: command.content,
            status: command.status,
            isFeatured: command.isFeatured,
            metadata: command.metadata ? { ...article.metadata, ...command.metadata } : undefined,
            updatedAt: new Date()
        });

        await this.articleRepository.save(updatedArticle);
    }
}
