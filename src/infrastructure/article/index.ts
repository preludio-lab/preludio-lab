import { ArticleRepository } from '@/domain/article/article.repository';
import { ArticleRepositoryFactory } from './article.factory';
import { env } from '@/lib/env';
import { APP_ENV } from '@/lib/constants';

/**
 * ArticleRepository の共有インスタンス (Singleton)
 *
 * 実行環境に応じて、ローカルファイルシステムまたは R2/Turso を切り替えます。
 */
const isProductionLike =
  env.NEXT_PUBLIC_APP_ENV === APP_ENV.PRODUCTION || env.NEXT_PUBLIC_APP_ENV === APP_ENV.STAGING;

export const articleRepository: ArticleRepository = ArticleRepositoryFactory.getInstance({
  isProductionLike,
});
