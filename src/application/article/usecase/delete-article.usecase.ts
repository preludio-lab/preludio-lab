import { ArticleMasterId } from '@/domain/article/article.control';
import { ArticleRepository } from '@/domain/article/article.repository';

/**
 * DeleteArticleUseCase
 * 記事削除
 */
export class DeleteArticleUseCase {
  constructor(private readonly articleRepository: ArticleRepository) {}

  async execute(id: ArticleMasterId): Promise<void> {
    await this.articleRepository.deleteMaster(id);
  }
}
