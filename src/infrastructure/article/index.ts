import { ArticleRepository } from '@/domain/article/article.repository';
import { ArticleRepositoryFactory } from './article.factory';
import { infraConfig } from '../shared/config';

/**
 * ArticleRepository の共有インスタンス (Singleton)
 *
 * インフラ構成 (infraConfig) に基づいて、ローカルファイルシステムまたは R2/Turso を切り替えます。
 * デフォルトでは Cloud (R2/Turso) が使用されます。
 */
export const articleRepository: ArticleRepository = ArticleRepositoryFactory.create(infraConfig);
