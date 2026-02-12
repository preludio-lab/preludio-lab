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

/**
 * ArticleRepository の実装クラス。
 * BasePayloadRepository を拡張し、メタデータとコンテンツの統合管理を行います。
 * Tursoなどの具体的なDB知識は、注入される DataSource と Mapper関数によって抽象化されています。
 */
export class ArticleRepositoryImpl
  extends BasePayloadRepository<
    Article,
    ArticleMetadataRow,
    IArticleMetadataDataSource,
    ArticleSearchCriteria
  >
  implements ArticleRepository
{
  constructor(
    metadataDS: IArticleMetadataDataSource,
    payloadDS: IObjectStorage,
    private readonly pathStrategy: ArticlePathStrategy,
    /** ドメインエンティティへの変換関数 (再構成) */
    private readonly _mapToDomain: (row: ArticleMetadataRow) => Article,
    /** 永続化用データへの変換関数 */
    private readonly _mapToPersistence: (entity: Article) => ArticleMetadataRow,
    logger: Logger,
  ) {
    super(metadataDS, payloadDS, logger);
  }

  /**
   * IDと言語を指定して記事を取得します。
   */
  async findById(id: string, lang: string): Promise<Article | null> {
    try {
      return this._findOne(id, (ds) => ds.findById(id, lang));
    } catch (err) {
      if (err instanceof AppError) throw err;
      this.logger.error(`FindById failed: ${id}`, err as Error, { id, lang });
      throw new AppError('Database error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  /**
   * 言語、カテゴリー、スラグを指定して記事を取得します。
   */
  async findBySlug(lang: string, category: ArticleCategory, slug: string): Promise<Article | null> {
    try {
      return this._findOne(slug, (ds) => ds.findBySlug(slug, lang, category));
    } catch (err) {
      if (err instanceof AppError) throw err;
      this.logger.error(`FindBySlug failed: ${slug}`, err as Error, { slug, lang, category });
      throw new AppError('Database error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  /**
   * 検索条件に基づいて記事一覧を取得します。
   */
  async findMany(criteria: ArticleSearchCriteria): Promise<PagedResponse<Article>> {
    try {
      return await this._findMany(criteria, (ds) => ds.findMany(criteria));
    } catch (err) {
      this.logger.error('FindMany failed', err as Error);
      throw new AppError('Database error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  async save(article: Article): Promise<void> {
    try {
      await this._save(article);
    } catch (err) {
      this.logger.error(`Save failed: ${article.id}`, err as Error, { id: article.id });
      throw new AppError('Database error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this._delete(id);
    } catch (err) {
      this.logger.error(`Delete failed: ${id}`, err as Error, { id });
      throw new AppError('Database error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  // --- Implementation of Abstract Methods ---

  /**
   * メタデータ行から、対応するコンテンツのストレージキー（R2パス）を解決します。
   */
  protected resolveStorageKey(row: ArticleMetadataRow): string | null {
    const article = this._mapToDomain(row);
    return this.pathStrategy.resolvePath(article);
  }

  /**
   * メタデータとストレージから取得したペイロード（MDX）を組み合わせて
   * Articleドメインエンティティを再構成します。
   */
  protected reconstituteWithPayload(row: ArticleMetadataRow, payload: string | null): Article {
    const article = this._mapToDomain(row);

    // ストレージから取得したペイロード（MDX本文）が存在しない場合は、
    // コンテンツ本文が空の状態（メタデータのみ）のドメインエンティティを返します。
    if (!payload) {
      return article;
    }

    const processedBody = preprocessMdx(payload);

    return new Article({
      control: article.control,
      metadata: article.metadata,
      content: new ArticleContent({
        body: processedBody,
        structure: article.content.structure,
      }),
      context: article.context,
      engagement: article.engagement,
    });
  }

  /**
   * メタデータのみから再構成します (findMany用)。
   */
  protected override reconstitute(row: ArticleMetadataRow): Article {
    return this._mapToDomain(row);
  }

  /**
   * ドメインエンティティから永続化用データに変換します。
   */
  protected mapToPersistence(entity: Article): ArticleMetadataRow {
    return this._mapToPersistence(entity);
  }

  /**
   * メタデータをDBに保存します。
   */
  protected async persistMetadata(row: ArticleMetadataRow): Promise<void> {
    await this.metadataDS.save(row);
  }

  /**
   * メタデータをDBから削除します。
   */
  protected async deleteMetadata(id: string): Promise<void> {
    await this.metadataDS.delete(id);
  }

  /**
   * エンティティからコンテンツ（本文）を抽出します。
   */
  protected extractPayload(entity: Article): string | null {
    return entity.content.body;
  }

  /**
   * コンテンツをストレージに保存します。
   */
  protected async persistPayload(key: string, content: string): Promise<void> {
    await this.payloadDS.put(key, content);
  }

  /**
   * コンテンツをストレージから削除します。
   */
  protected async deletePayload(key: string): Promise<void> {
    await this.payloadDS.delete(key);
  }

  /**
   * IDからメタデータを取得します（削除前のキー特定用）。
   */
  protected async getMetadataById(id: string): Promise<ArticleMetadataRow | null> {
    // Note: 言語が特定できないため、最新の全言語のいずれかを取得、あるいは特定ロジックが必要。
    // ここでは簡易的に ID 指定で検索（DataSource側の実装に依存）
    const row = await this.metadataDS.findById(id, 'ja'); // デフォルト等の扱い
    return row ?? null;
  }
}
