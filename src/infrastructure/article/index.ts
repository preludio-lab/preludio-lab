import { ArticleRepository } from '@/domain/article/article.repository';
import { ArticleRepositoryImpl } from './article.repository';
import { FsArticleMetadataDataSource } from './fs.article.metadata.ds';
import { FsArticleContentDataSource } from './fs.article.content.ds';
import { TursoArticleMetadataDataSource } from './turso.article.metadata.ds';
import { R2ArticleContentDataSource } from './r2.article.content.ds';

import { logger } from '@/infrastructure/logging';
import { env } from '@/lib/env';
import { APP_ENV } from '@/lib/constants';

/**
 * ArticleRepository の共有インスタンス (Singleton)
 *
 * 実行環境に応じて、ローカルファイルシステムまたは R2/Turso を切り替えます。
 */
const isProductionLike =
  env.NEXT_PUBLIC_APP_ENV === APP_ENV.PRODUCTION || env.NEXT_PUBLIC_APP_ENV === APP_ENV.STAGING;

const metadataDS = isProductionLike
  ? new TursoArticleMetadataDataSource(logger)
  : new FsArticleMetadataDataSource();

const contentDS = isProductionLike
  ? new R2ArticleContentDataSource(logger)
  : new FsArticleContentDataSource();

export const articleRepository: ArticleRepository = new ArticleRepositoryImpl(
  metadataDS,
  contentDS,
  logger,
);
