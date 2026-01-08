import { ArticleRepository } from '@/domain/article/ArticleRepository';
import { FsArticleRepository } from './FsArticleRepository';

/**
 * ArticleRepository の共有インスタンス (Singleton)
 * 
 * 将来的にデータベース（Turso 等）へ移行する際は、ここでインスタンス化するクラス
 * を差し替えることで、アプリケーション全体の実装を透過的に切り替えることができます。
 */
export const articleRepository: ArticleRepository = new FsArticleRepository();
