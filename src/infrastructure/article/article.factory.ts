import path from 'path';
import { ArticleRepository } from '@/domain/article/article.repository';
import { ArticleRepositoryImpl } from './article.repository';
import { FsArticleMetadataDataSource } from './metadata/fs.article.metadata.ds';
import { TursoArticleMetadataDataSource } from './metadata/turso.article.metadata.ds';
import { logger } from '@/infrastructure/logging';
import { R2StorageService } from '../storage/r2.storage';
import { FileSystemStorageService } from '../storage/fs.storage';
import { TursoArticleMapper } from './metadata/turso.article.metadata.mapper';
import { InfrastructureConfig } from '../shared/config';
import { IArticleMetadataDataSource } from './metadata/article.metadata.ds';
import { IObjectStorage } from '../storage/storage.interface';
import { ArticlePathStrategy } from './content/article.path.strategy';
import { Article } from '@/domain/article/article';
import { ArticleContentMapper } from './content/article.content.mapper';

export class ArticleRepositoryFactory {
  private static instance: ArticleRepository | null = null;

  /**
   * テスト用にシングルトンインスタンスをリセットします。
   */
  static reset(): void {
    this.instance = null;
  }

  /**
   * ArticleRepository のシングルトンインスタンスを返します。
   * インスタンスが既に存在する場合は、既存のものを返します。
   * そうでない場合は、提供された設定に基づいて新しいインスタンスを作成します。
   *
   * @param config 使用するデータソース構成
   */
  static create(config: InfrastructureConfig): ArticleRepository {
    if (this.instance) {
      return this.instance;
    }

    logger.debug(
      `Initializing ArticleRepository (Metadata: ${config.metadata}, Payload: ${config.payload})`,
    );

    // 1. Metadata DataSource の選択
    const metadataDS: IArticleMetadataDataSource =
      config.metadata === 'turso'
        ? new TursoArticleMetadataDataSource(logger)
        : new FsArticleMetadataDataSource();

    // 2. Payload (Storage) の選択
    const storage: IObjectStorage =
      config.payload === 'r2'
        ? new R2StorageService(undefined, 'private/articles/')
        : new FileSystemStorageService(path.join(process.cwd(), 'article'));

    // 3. Path Strategy の初期化
    const pathStrategy = new ArticlePathStrategy();

    this.instance = new ArticleRepositoryImpl(
      metadataDS,
      storage,
      pathStrategy,
      // Metadata 再構築 (Row -> Summary)
      (row) => TursoArticleMapper.toSummary(row.articles, row.article_translations),
      // Aggregate 再構築 (Summary + Payload -> Article)
      (summary, payload) => {
        return new Article({
          control: summary.control,
          metadata: summary.metadata,
          engagement: summary.engagement,
          context: summary.context,
          content: ArticleContentMapper.toDomain(payload, undefined, summary.metadata.slug),
        });
      },
      // Persistence Metadata 変換 (Entity -> Row)
      TursoArticleMapper.toPersistence,
      // Persistence Payload 変換 (Content -> String)
      (article) => ArticleContentMapper.toPersistence(article.content),
      logger,
    );

    return this.instance;
  }

  /**
   * @deprecated 使用を取りやめ、create() を使用してください。
   */
  static getInstance(config: { isProductionLike: boolean }): ArticleRepository {
    return this.create({
      metadata: config.isProductionLike ? 'turso' : 'fs',
      payload: config.isProductionLike ? 'r2' : 'fs',
    });
  }
}
