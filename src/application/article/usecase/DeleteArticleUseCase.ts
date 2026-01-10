import { ArticleRepository } from '@/domain/article/ArticleRepository';

/**
 * DeleteArticleUseCase
 * 記事削除
 */
export class DeleteArticleUseCase {
  constructor(private readonly articleRepository: ArticleRepository) {}

  async execute(id: string): Promise<void> {
    await this.articleRepository.delete(id);
  }
}
