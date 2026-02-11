import { ArticleRepository } from '@/domain/article/article.repository';
import { ArticleRepositoryImpl } from './article.repository';
import { FsArticleMetadataDataSource } from './fs.article.metadata.ds';
import { FsArticleContentDataSource } from './fs.article.content.ds';
import { TursoArticleMetadataDataSource } from './turso.article.metadata.ds';
import { R2ArticleContentDataSource } from './r2.article.content.ds';
import { logger } from '@/infrastructure/logging';

export interface ArticleRepositoryConfig {
  isProductionLike: boolean;
}

export class ArticleRepositoryFactory {
  private static instance: ArticleRepository;

  /**
   * Returns a singleton instance of ArticleRepository.
   * If an instance already exists, it returns the existing one.
   * Otherwise, it creates a new instance based on the provided configuration.
   *
   * @param config Configuration object determining which data sources to use
   */
  static getInstance(config: ArticleRepositoryConfig): ArticleRepository {
    if (this.instance) {
      return this.instance;
    }

    const { isProductionLike } = config;

    logger.info(`Initializing ArticleRepository (ProductionLike: ${isProductionLike})`);

    const metadataDS = isProductionLike
      ? new TursoArticleMetadataDataSource(logger)
      : new FsArticleMetadataDataSource();

    const contentDS = isProductionLike
      ? new R2ArticleContentDataSource(logger)
      : new FsArticleContentDataSource();

    this.instance = new ArticleRepositoryImpl(metadataDS, contentDS, logger);

    return this.instance;
  }
}
