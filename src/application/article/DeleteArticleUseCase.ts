import { IArticleRepository } from '@/domain/article/IArticleRepository';

/**
 * DeleteArticleUseCase
 * 記事削除
 */
export class DeleteArticleUseCase {
    constructor(private readonly articleRepository: IArticleRepository) { }

    async execute(id: string): Promise<void> {
        await this.articleRepository.delete(id);
    }
}
