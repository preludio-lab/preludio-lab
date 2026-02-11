import { ArticleRepository, ArticleSearchCriteria } from '@/domain/article/article.repository';
import { ArticleCategory } from '@/domain/article/article.metadata';
import { Article, ArticleContent } from '@/domain/article/article';
import { PagedResponse } from '@/domain/shared/pagination';
import {
  IArticleMetadataDataSource,
  ArticleMetadataRow,
} from './metadata/article.metadata.ds.interface';
import { Logger } from '@/shared/logging/logger';
import { AppError } from '@/domain/shared/app-error';
import { BasePayloadRepository } from '../shared/base.repository';
import { IObjectStorage } from '../storage/storage.interface';
import { ArticlePathStrategy } from './content/article.path.strategy';
import { preprocessMdx } from './content/mdx.preprocessor';
import { TursoArticleMapper } from './metadata/turso.article.mapper';

/**
 * ArticleRepository の実装クラス。
 * BasePayloadRepository を拡張し、メタデータとコンテンツの統合管理を行います。
 */
export class ArticleRepositoryImpl
  extends BasePayloadRepository<Article, ArticleMetadataRow, IArticleMetadataDataSource>
  implements ArticleRepository
{
  constructor(
    metadataDS: IArticleMetadataDataSource,
    payloadDS: IObjectStorage,
    private readonly pathStrategy: ArticlePathStrategy,
    logger: Logger,
  ) {
    super(metadataDS, payloadDS, logger);
  }

  /**
   * IDと言語を指定して記事を取得します。
   * メタデータ（DB）とペイロード（ストレージのMDX）を組み合わせて再構成します。
   *
   * @param id 記事ID
   * @param lang 言語コード
   * @returns 記事エンティティ（見つからない場合はnull）
   */
  async findById(id: string, lang: string): Promise<Article | null> {
    try {
      return await this.findOne((ds: IArticleMetadataDataSource) => ds.findById(id, lang), id);
    } catch (err) {
      if (err instanceof AppError) throw err;
      this.logger.error(`FindById failed: ${id}`, err as Error, { id, lang });
      throw new AppError('Database error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  /**
   * 言語、カテゴリー、スラグを指定して記事を取得します。
   * メタデータ（DB）とペイロード（ストレージのMDX）を組み合わせて再構成します。
   *
   * @param lang 言語コード
   * @param category 記事カテゴリー
   * @param slug スラグ
   * @returns 記事エンティティ（見つからない場合はnull）
   */
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

  /**
   * 検索条件に基づいて記事一覧を取得します。
   * パフォーマンスのため、一覧表示ではストレージからのコンテンツ取得は行わずメタデータのみを返します。
   *
   * @param criteria 検索・絞り込み条件
   * @returns ページネーションされた記事一覧
   */
  async findMany(criteria: ArticleSearchCriteria): Promise<PagedResponse<Article>> {
    try {
      // 1. メタデータDSから記事を取得 (一覧取得ではパフォーマンスのためコンテンツ取得はスキップ)
      const { rows, totalCount } = await this.metadataDS.findMany(criteria);

      const items = rows
        .map((row) => {
          try {
            return TursoArticleMapper.toDomain(row.articles, row.article_translations, null);
          } catch (e) {
            this.logger.error(`Mapping failed for article in list: ${row.articles.id}`, e as Error);
            return null;
          }
        })
        .filter((item): item is Article => item !== null);

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

  /**
   * 記事を保存します（未実装）。
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async save(_article: Article): Promise<void> {
    throw new Error('Method not implemented.');
  }

  /**
   * 記事を削除します（未実装）。
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async delete(_id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  // --- Implementation of BasePayloadRepository ---

  /**
   * メタデータ行から、対応するコンテンツのストレージキー（R2パス）を解決します。
   */
  protected resolveStorageKey(row: ArticleMetadataRow): string | null {
    // 一時的にArticleドメインオブジェクトに変換してパス解決を行う
    const article = TursoArticleMapper.toDomain(row.articles, row.article_translations, null);
    return this.pathStrategy.resolvePath(article);
  }

  /**
   * メタデータとストレージから取得したペイロード（MDX）を組み合わせて
   * Articleドメインエンティティを再構成します。
   */
  protected reconstituteWithPayload(row: ArticleMetadataRow, payload: string | null): Article {
    // 1. 基本的なドメインオブジェクトを再構成
    const article = TursoArticleMapper.toDomain(row.articles, row.article_translations, null);

    if (!payload) {
      return article;
    }

    // 2. ペイロード（MDX）がある場合は処理して適用
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

  /**
   * メタデータのみから記事ドメインエンティティを再構成します。
   * 主に一覧表示など、本文を必要としない場合に使用されます。
   */
  protected reconstitute(row: ArticleMetadataRow): Article {
    return TursoArticleMapper.toDomain(row.articles, row.article_translations, null);
  }
}
