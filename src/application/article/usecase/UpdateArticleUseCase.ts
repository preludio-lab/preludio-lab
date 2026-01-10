import { ArticleRepository } from '@/domain/article/ArticleRepository';
import { ArticleMetadata } from '@/domain/article/ArticleMetadata';
import { ArticleStatus } from '@/domain/article/ArticleControl';
import { ArticleCategory } from '@/domain/article/ArticleMetadata';

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
  constructor(private readonly articleRepository: ArticleRepository) {}

  async execute(command: UpdateArticleCommand): Promise<void> {
    const article = await this.articleRepository.findById(command.id);
    if (!article) {
      throw new Error(`Article not found: ${command.id}`);
    }

    const updatedArticle = article.cloneWith({
      control: {
        status: command.status ?? article.control.status,
        updatedAt: new Date(),
      },
      content: command.content
        ? {
            ...article.content,
            body: command.content,
          }
        : undefined,
      metadata: {
        ...article.metadata,
        ...command.metadata,
        ...(command.isFeatured !== undefined ? { isFeatured: command.isFeatured } : {}),
      },
    });

    await this.articleRepository.save(updatedArticle);
  }
}
