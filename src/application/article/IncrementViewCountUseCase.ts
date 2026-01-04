import { IArticleRepository } from '@/domain/article/IArticleRepository';

/**
 * IncrementViewCountUseCase
 * 記事の閲覧数をインクリメントする
 */
export class IncrementViewCountUseCase {
    constructor(private readonly articleRepository: IArticleRepository) { }

    async execute(id: string): Promise<void> {
        // In FS Implementation:
        // We do not persist view counts to MDX files to avoid frequent IO writes.
        // This serves as a placeholder for Future DB implementation.
        // We might log it for analytics.

        // const article = await this.articleRepository.findById(id);
        // if (article) {
        //    // Update view count logic...
        // }

        // console.log(`[IncrementViewCount] Article ID: ${id}`);
        return Promise.resolve();
    }
}
