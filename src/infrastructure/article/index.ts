import { ArticleRepository } from '@/domain/article/article.repository';
import { ArticleRepositoryImpl } from './article.repository';
import { FsArticleMetadataDataSource } from './fs.article.metadata.ds';
import { FsArticleContentDataSource } from './fs.article.content.ds';

import { logger } from '@/infrastructure/logging';

/**
 * ArticleRepository の共有インスタンス (Singleton)
 *
 * 将来的にデータベース（Turso 等）へ移行する際は、ここでインスタンス化するクラス
 * を差し替えることで、アプリケーション全体の実装を透過的に切り替えることができます。
 */
const metadataDS = new FsArticleMetadataDataSource();
const contentDS = new FsArticleContentDataSource();
export const articleRepository: ArticleRepository = new ArticleRepositoryImpl(
  metadataDS,
  contentDS,
  logger,
);
