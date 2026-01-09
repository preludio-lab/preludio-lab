import { ArticleRepository } from '@/domain/article/ArticleRepository';
import { Logger } from '@/shared/logging/logger';

/**
 * IncrementViewCountUseCase
 * 記事の閲覧数をインクリメントする
 */
export class IncrementViewCountUseCase {
  constructor(
    private readonly articleRepository: ArticleRepository,
    private readonly logger: Logger,
  ) {}

  async execute(id: string): Promise<void> {
    // In FS Implementation:
    // We do not persist view counts to MDX files to avoid frequent IO writes.
    // This serves as a placeholder for Future DB implementation.
    // We might log it for analytics.

    // const article = await this.articleRepository.findById(id);
    // if (article) {
    //    // Update view count logic...
    // }

    this.logger.info(`[IncrementViewCount] Article ID: ${id}`);
    return Promise.resolve();
  }
}
