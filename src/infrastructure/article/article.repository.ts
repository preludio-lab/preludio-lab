import { ArticleRepository, ArticleSearchCriteria } from '@/domain/article/article.repository';
import { ArticleCategory } from '@/domain/article/article.metadata';
import { Article, ArticleContent } from '@/domain/article/article';
import { PagedResponse } from '@/domain/shared/pagination';
import { IArticleMetadataDataSource } from './metadata/article.metadata.ds.interface';
import { Logger } from '@/shared/logging/logger';
import { AppError } from '@/domain/shared/app-error';
import { BasePayloadRepository } from '../shared/base.repository';
import { IObjectStorage } from '../storage/storage.interface';
import { ArticlePathStrategy } from './content/article.path.strategy';
import { preprocessMdx } from './content/mdx.preprocessor';

/**
 * ArticleRepository の実装クラス。
 * BasePayloadRepository を拡張し、メタデータとコンテンツの統合管理を行います。
 */
export class ArticleRepositoryImpl
  extends BasePayloadRepository<Article, Article, IArticleMetadataDataSource>
  implements ArticleRepository
{
  constructor(
    metadataDS: IArticleMetadataDataSource,
    storage: IObjectStorage,
    private readonly pathStrategy: ArticlePathStrategy,
    logger: Logger,
  ) {
    super(metadataDS, storage, logger);
  }

  async findById(id: string, lang: string): Promise<Article | null> {
    try {
      return await this.findOne((ds: IArticleMetadataDataSource) => ds.findById(id, lang), id);
    } catch (err) {
      if (err instanceof AppError) throw err;
      this.logger.error(`FindById failed: ${id}`, err as Error, { id, lang });
      throw new AppError('Database error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  async findBySlug(lang: string, category: ArticleCategory, slug: string): Promise<Article | null> {
    try {
      return await this.findOne(
        (ds: IArticleMetadataDataSource) => ds.findBySlug(slug, lang, category),
        slug,
      );
    } catch (err) {
      if (err instanceof AppError) throw err;
      this.logger.error(`FindBySlug failed: ${slug}`, err as Error, { slug, lang, category });
      throw new AppError('Database error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  async findMany(criteria: ArticleSearchCriteria): Promise<PagedResponse<Article>> {
    try {
      // 1. メタデータDSから記事を取得 (一覧取得ではパフォーマンスのためコンテンツ取得はスキップ)
      const { items, totalCount } = await this.metadataDS.findMany(criteria);

      return {
        items,
        totalCount,
        hasNextPage:
          (criteria.pagination.offset || 0) + (criteria.pagination.limit || 20) < totalCount,
      };
    } catch (err) {
      this.logger.error('FindMany failed', err as Error);
      throw new AppError('Database error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  async save(_: Article): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async delete(_: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  // --- Implementation of BasePayloadRepository ---

  protected resolveStorageKey(article: Article): string | null {
    return this.pathStrategy.resolvePath(article);
  }

  protected reconstituteWithPayload(article: Article, payload: string | null): Article {
    if (!payload) {
      return article; // Already has null body
    }

    // MDXコンテンツを処理
    const processedContent = preprocessMdx(payload);

    return new Article({
      control: article.control,
      metadata: article.metadata,
      content: new ArticleContent({
        body: processedContent,
        structure: article.content.structure,
      }),
      context: article.context,
      engagement: article.engagement,
    });
  }
}
