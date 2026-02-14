import { ArticleRepository, ArticleSearchCriteria } from '@/domain/article/article.repository';
import { ArticleCategory } from '@/domain/article/article.metadata';
import { Article, ArticleContent, ArticleSummary } from '@/domain/article/article';
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
 *
 * BasePayloadRepository を拡張し、記事のメタデータとコンテンツ（MDX）の統合管理を行います。
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
  /**
   * ArticleRepositoryImpl を初期化します。
   *
   * @param metadataDS - 記事メタデータのデータソース
   * @param payloadDS - 記事コンテンツ（MDXなど）のオブジェクトストレージ
   * @param pathStrategy - コンテンツの保存パスを決定する戦略
   * @param _reconstitute - メタデータの行をドメインエンティティ（フル）に変換する関数
   * @param _reconstituteSummary - メタデータの行をサマリーエンティティに変換する関数
   * @param _toPersistence - ドメインエンティティを永続化用のデータ型に変換する関数
   * @param logger - ロガーインスタンス
   */
  constructor(
    metadataDS: IArticleMetadataDataSource,
    payloadDS: IObjectStorage,
    private readonly pathStrategy: ArticlePathStrategy,
    private readonly _reconstitute: (row: ArticleMetadataRow) => Article,
    private readonly _reconstituteSummary: (row: ArticleMetadataRow) => ArticleSummary,
    private readonly _toPersistence: (entity: Article | ArticleSummary) => ArticleMetadataRow,
    logger: Logger,
  ) {
    super(metadataDS, payloadDS, logger);
  }

  /**
   * ID と言語を指定して記事（フル）を取得します。
   */
  async findById(id: string, lang: string): Promise<Article | null> {
    try {
      return await this._findOne(id, (ds) => ds.findById(id, lang));
    } catch (err) {
      if (err instanceof AppError) throw err;
      this.logger.error(`FindById failed: ${id}`, err as Error, { id, lang });
      throw new AppError('既知のエラーが発生しました', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  /**
   * 言語、カテゴリー、スラグを指定して記事（フル）を取得します。
   */
  async findBySlug(lang: string, category: ArticleCategory, slug: string): Promise<Article | null> {
    try {
      return await this._findOne(slug, (ds) => ds.findBySlug(slug, lang, category));
    } catch (err) {
      if (err instanceof AppError) throw err;
      this.logger.error(`FindBySlug failed: ${slug}`, err as Error, { slug, lang, category });
      throw new AppError('既知のエラーが発生しました', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  /**
   * ID と言語を指定して記事サマリーを取得します。
   */
  async findSummaryById(id: string, lang: string): Promise<ArticleSummary | null> {
    try {
      const row = await this.metadataDS.findById(id, lang);
      return row ? this._reconstituteSummary(row) : null;
    } catch (err) {
      this.logger.error(`FindSummaryById failed: ${id}`, err as Error, { id, lang });
      throw new AppError('記事サマリーの取得に失敗しました', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  /**
   * スラグを指定して記事サマリーを取得します。
   */
  async findSummaryBySlug(
    lang: string,
    category: ArticleCategory,
    slug: string,
  ): Promise<ArticleSummary | null> {
    try {
      const row = await this.metadataDS.findBySlug(slug, lang, category);
      return row ? this._reconstituteSummary(row) : null;
    } catch (err) {
      this.logger.error(`FindSummaryBySlug failed: ${slug}`, err as Error, {
        slug,
        lang,
        category,
      });
      throw new AppError('記事サマリーの取得に失敗しました', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  /**
   * 条件に基づいて記事の一覧（サマリー）を検索します。
   */
  async search(criteria: ArticleSearchCriteria): Promise<PagedResponse<ArticleSummary>> {
    try {
      const { rows, totalCount } = await this.metadataDS.findMany(criteria);
      return {
        items: rows.map((row) => this._reconstituteSummary(row)),
        totalCount: totalCount,
        hasNextPage: criteria.pagination.offset + criteria.pagination.limit < totalCount,
      };
    } catch (err) {
      this.logger.error('Search failed', err as Error);
      throw new AppError('記事の検索に失敗しました', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  /**
   * 記事を保存します。
   */
  async save(article: Article): Promise<void> {
    try {
      await this._save(article, (ds, row) => ds.save(row));
    } catch (err) {
      this.logger.error(`Save failed: ${article.id}`, err as Error, { id: article.id });
      throw new AppError('記事の保存に失敗しました', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  /**
   * 特定の言語版の記事を削除します。
   */
  async deleteById(id: string, lang: string): Promise<void> {
    try {
      await this._delete(
        id,
        async (ds) => {
          // 1. 翻訳レコードを削除
          await ds.deleteTranslation(id, lang);
          // 2. 残りの翻訳件数を確認し、0件なら Master も削除
          const count = await ds.countTranslations(id);
          if (count === 0) {
            await ds.deleteAll(id);
          }
        },
        (ds) => ds.findById(id, lang),
      );
    } catch (err) {
      this.logger.error(`DeleteById failed: ${id}`, err as Error, { id, lang });
      throw new AppError('記事の削除に失敗しました', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  /**
   * 記事そのもの（全言語版を含む）を完全に削除します。
   */
  async deleteMaster(id: string): Promise<void> {
    try {
      // 1. 全言語の翻訳メタデータを取得してストレージキーを特定
      const translations = await this.metadataDS.findAllTranslations(id);

      // 2. 各言語の MDX ペイロードを削除
      for (const row of translations) {
        const key = this.resolveStorageKey(row);
        if (key) {
          await this.deletePayload(key);
        }
      }

      // 3. DB の Master レコードと全翻訳を削除
      await this.metadataDS.deleteAll(id);
      this.logger.info(`Master deletion completed for article: ${id}`);
    } catch (err) {
      this.logger.error(`DeleteMaster failed: ${id}`, err as Error, { id });
      throw new AppError('記事の完全削除に失敗しました', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  // --- BaseRepository 抽象メソッドの実装 ---

  protected resolveStorageKey(metadata: ArticleMetadataRow): string | null {
    const article = this.reconstitute(metadata);
    return this.pathStrategy.resolvePath(article);
  }

  protected reconstituteWithPayload(row: ArticleMetadataRow, payload: string | null): Article {
    const article = this.reconstitute(row);
    if (!payload) return article;

    return new Article({
      control: article.control,
      metadata: article.metadata,
      content: new ArticleContent({
        body: preprocessMdx(payload),
        structure: article.content.structure,
      }),
      context: article.context,
      engagement: article.engagement,
    });
  }

  protected override reconstitute(row: ArticleMetadataRow): Article {
    return this._reconstitute(row);
  }

  protected toPersistence(article: Article): ArticleMetadataRow {
    return this._toPersistence(article);
  }

  protected extractPayload(entity: Article): string | null {
    return entity.content.body;
  }

  protected async persistPayload(key: string, content: string): Promise<void> {
    await this.payloadDS.put(key, content);
  }

  protected async deletePayload(key: string): Promise<void> {
    await this.payloadDS.delete(key);
  }
}
