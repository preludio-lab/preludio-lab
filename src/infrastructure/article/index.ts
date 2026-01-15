import { ArticleRepository } from '@/domain/article/ArticleRepository';
// import { FsArticleRepository } from './fs-article.repository';
import { FsComposedArticleRepository } from './fs-composed.repository';
import { FsArticleMetadataDataSource } from './fs-metadata.ds';
import { FsArticleContentDataSource } from './fs-content.ds';

/**
 * ArticleRepository の共有インスタンス (Singleton)
 *
 * 将来的にデータベース（Turso 等）へ移行する際は、ここでインスタンス化するクラス
 * を差し替えることで、アプリケーション全体の実装を透過的に切り替えることができます。
 */
// export const articleRepository: ArticleRepository = new FsArticleRepository();

// FS実装 (Composed: DataSource分離版)
const metadataDS = new FsArticleMetadataDataSource();
const contentDS = new FsArticleContentDataSource();
export const articleRepository: ArticleRepository = new FsComposedArticleRepository(metadataDS, contentDS);
