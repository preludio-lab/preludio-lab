import path from 'path';
import { ArticleRepository } from '@/domain/article/article.repository';
import { ArticleRepositoryImpl } from './article.repository';
import { FsArticleMetadataDataSource } from './metadata/fs.article.metadata.ds';
import { TursoArticleMetadataDataSource } from './metadata/turso.article.metadata.ds';
import { logger } from '@/infrastructure/logging';
import { R2StorageService } from '../storage/r2.storage';
import { FileSystemStorageService } from '../storage/fs.storage';
import { ArticlePathStrategy } from './content/article.path.strategy';

export interface ArticleRepositoryConfig {
  isProductionLike: boolean;
}

export class ArticleRepositoryFactory {
  private static instance: ArticleRepository;

  /**
   * ArticleRepository のシングルトンインスタンスを返します。
   * インスタンスが既に存在する場合は、既存のものを返します。
   * そうでない場合は、提供された設定に基づいて新しいインスタンスを作成します。
   *
   * @param config 使用するデータソースを決定する設定オブジェクト
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

    const storage = isProductionLike
      ? new R2StorageService(undefined, 'private/articles/')
      : new FileSystemStorageService(path.join(process.cwd(), 'article'));

    const pathStrategy = new ArticlePathStrategy();

    this.instance = new ArticleRepositoryImpl(metadataDS, storage, pathStrategy, logger);

    return this.instance;
  }
}
