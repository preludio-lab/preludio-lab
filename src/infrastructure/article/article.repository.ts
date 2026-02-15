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
    ArticleSummary,
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
   * @param _reconstituteMetadata - サマリーエンティティ（Base）への変換関数
   * @param _reconstituteAggregate - フルエンティティ（Aggregate）への変換関数
   * @param _toPersistence - ドメインエンティティを永続化形式へ変換する関数
   * @param logger - ロガー
   */
  constructor(
    metadataDS: IArticleMetadataDataSource,
    payloadDS: IObjectStorage,
    private readonly pathStrategy: ArticlePathStrategy,
    private readonly _reconstituteMetadata: (row: ArticleMetadataRow) => ArticleSummary,
    private readonly _reconstituteAggregate: (row: ArticleMetadataRow) => Article,
    private readonly _toPersistenceMetadata: (
      entity: Article | ArticleSummary,
    ) => ArticleMetadataRow,
    logger: Logger,
  ) {
    super(metadataDS, payloadDS, logger);
  }

  /**
   * ID と言語を指定して記事（フル）を取得します。
   * 基底クラスの _findOne を利用し、メタデータとペイロードを統合した完全な集約 (Article) を取得します。
   *
   * @param id - 記事ID
   * @param lang - 言語コード
   * @returns 再構築された Article または null
   */
  async findById(id: string, lang: string): Promise<Article | null> {
    try {
      return await this._findOne(id, (ds) => ds.findById(id, lang));
    } catch (err) {
      if (err instanceof AppError) throw err;
      this.logger.error(`findById failed: ${id}`, err as Error, { id, lang });
      throw new AppError('Failed to fetch article', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  /**
   * スラグ、言語、カテゴリーを指定して記事（フル）を取得します。
   * 検索エンジンフレンドリーな URL から完全な記事データを復元します。
   *
   * @param lang - 言語コード
   * @param category - カテゴリー
   * @param slug - スラグ
   * @returns 再構築された Article または null
   */
  async findBySlug(lang: string, category: ArticleCategory, slug: string): Promise<Article | null> {
    try {
      return await this._findOne(slug, (ds) => ds.findBySlug(slug, lang, category));
    } catch (err) {
      if (err instanceof AppError) throw err;
      this.logger.error(`findBySlug failed: ${slug}`, err as Error, { slug, lang, category });
      throw new AppError('Failed to fetch article by slug', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  /**
   * ID と言語を指定して記事サマリーを取得します。
   *
   * @param id - 記事ID
   * @param lang - 言語コード
   * @returns 再構築された ArticleSummary または null
   */
  async findSummaryById(id: string, lang: string): Promise<ArticleSummary | null> {
    try {
      const row = await this.metadataDS.findById(id, lang);
      return row ? this.reconstituteMetadata(row) : null;
    } catch (err) {
      this.logger.error(`findSummaryById failed: ${id}`, err as Error, { id, lang });
      throw new AppError('Failed to fetch article summary', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  /**
   * スラグを指定して記事サマリーを取得します。
   *
   * @param lang - 言語コード
   * @param category - カテゴリー
   * @param slug - スラグ
   * @returns 再構築された ArticleSummary または null
   */
  async findSummaryBySlug(
    lang: string,
    category: ArticleCategory,
    slug: string,
  ): Promise<ArticleSummary | null> {
    try {
      const row = await this.metadataDS.findBySlug(slug, lang, category);
      return row ? this.reconstituteMetadata(row) : null;
    } catch (err) {
      this.logger.error(`findSummaryBySlug failed: ${slug}`, err as Error, {
        slug,
        lang,
        category,
      });
      throw new AppError(
        'Failed to fetch article summary by slug',
        'INFRASTRUCTURE_ERROR',
        500,
        err,
      );
    }
  }

  /**
   * 条件に基づいて記事の一覧（サマリー）を検索します。
   * ページング、フィルタリング、ソート条件に従って記事サマリーを取得します。
   *
   * @param criteria - 検索・ページング条件
   * @returns ページングされた ArticleSummary のレスポンス。hasNextPage 等のメタ情報を含みます。
   */
  async search(criteria: ArticleSearchCriteria): Promise<PagedResponse<ArticleSummary>> {
    try {
      const { rows, totalCount } = await this.metadataDS.findMany(criteria);
      return {
        items: rows.map((row) => this.reconstituteMetadata(row)),
        totalCount: totalCount,
        hasNextPage: criteria.pagination.offset + criteria.pagination.limit < totalCount,
      };
    } catch (err) {
      this.logger.error('search failed', err as Error);
      throw new AppError('Failed to search articles', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  /**
   * 記事を保存します（メタデータおよびコンテンツ）。
   *
   * @param article - 保存対象の Article エンティティ
   * @returns なし
   */
  async save(article: Article): Promise<void> {
    try {
      await this._save(article, (ds, row) => ds.save(row));
    } catch (err) {
      this.logger.error(`save failed: ${article.id}`, err as Error, {
        id: article.id,
        slug: article.slug,
        lang: article.lang,
        category: article.category,
      });
      throw new AppError('Failed to save article', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  /**
   * 特定の言語版の記事を削除します。
   * 翻訳が一つも残らなくなった場合、記事（Master）そのものも削除されます。
   *
   * 処理フロー:
   * 1. 基底クラスの _delete を介して、対象言語の翻訳とペイロードを削除
   * 2. deleteTranslation コールバック内で DB から翻訳レコードを物理削除
   * 3. 同一 ID の翻訳が他に存在しないか確認し、0件なら Master レコードも削除
   *
   * @param id - 記事ID
   * @param lang - 削除対象の言語コード
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
      this.logger.error(`deleteById failed: ${id}`, err as Error, { id, lang });
      throw new AppError('Failed to delete article translation', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  /**
   * 記事そのもの（全言語版およびコンテンツを含む）を完全に削除します。
   *
   * 処理フロー:
   * 1. 記事 ID に紐づく全言語の翻訳行を DB から取得
   * 2. 各言語のストレージパスを解決し、オブジェクトストレージから MDX を一括削除
   * 3. DB から Master レコードと紐づく全翻訳レコードを一括削除（deleteAll）
   *
   * @param id - 記事ID
   */
  async deleteMaster(id: string): Promise<void> {
    try {
      // 1. 全言語の翻訳メタデータを取得してストレージキーを特定
      const translations = await this.metadataDS.findAllTranslations(id);

      // 2. 各言語の MDX ペイロードを削除
      for (const row of translations) {
        const summary = this._reconstituteMetadata(row);
        const key = this.resolveStorageKey(summary);
        if (key) {
          await this.deletePayload(key);
        }
      }

      // 3. DB の Master レコードと全翻訳を削除
      await this.metadataDS.deleteAll(id);
      this.logger.info(`Master deletion completed for article: ${id}`);
    } catch (err) {
      this.logger.error(`deleteMaster failed: ${id}`, err as Error, { id });
      throw new AppError('Failed to delete master article', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  // --- BaseRepository 抽象メソッドの実装 ---

  /**
   * メタデータ行からストレージキー（MDXパス）を解決します。
   *
   * @param metadata - 記事のメタデータ行
   * @returns ストレージ上のパス（キー）、解決できない場合は null
   */
  protected resolveStorageKey(summary: ArticleSummary): string | null {
    // パス解決のためにサマリーを直接利用
    return this.pathStrategy.resolvePath(summary);
  }

  /**
   * ベースサマリーとペイロードから完全な Article アグリゲートを構築します。
   *
   * @param base - 再構築された ArticleSummary
   * @param payload - ストレージから取得した MDX コンテンツ
   * @returns 完全な Article エンティティ
   */
  protected reconstituteAggregate(base: ArticleSummary, payload: string | null): Article {
    return new Article({
      control: base.control,
      metadata: base.metadata,
      content: new ArticleContent({
        body: payload ? preprocessMdx(payload) : '',
        structure: (base as unknown as Article).content?.structure || { sections: [] },
      }),
      context: base.context,
      engagement: base.engagement,
    });
  }

  /**
   * メタデータ行から ArticleSummary を再構築します。
   *
   * @param row - DB から取得したメタデータ行
   * @returns 再構築された ArticleSummary
   */
  protected reconstituteMetadata(row: ArticleMetadataRow): ArticleSummary {
    return this._reconstituteMetadata(row);
  }

  /**
   * エンティティを永続化用のメタデータ行に変換します。
   *
   * @param entity - 変換対象の Article または ArticleSummary
   * @returns 永続化用のデータ型
   */
  protected toPersistenceMetadata(entity: Article | ArticleSummary): ArticleMetadataRow {
    return this._toPersistenceMetadata(entity);
  }

  /**
   * ドメインエンティティから永続化用のペイロード（MDX）に変換します。
   *
   * @param entity - 変換対象の Article
   * @returns MDX 文字列、または保存対象がない場合は null
   */
  protected toPersistencePayload(entity: Article): string | null {
    return entity.content.body;
  }

  /**
   * ペイロード（MDX）をストレージに保存します。
   *
   * @param key - 保存先パス（キー）
   * @param content - 保存する MDX 内容
   * @returns なし
   */
  protected async persistPayload(key: string, content: string): Promise<void> {
    await this.payloadDS.put(key, content);
  }

  /**
   * ペイロード（MDX）をストレージから削除します。
   *
   * @param key - 削除対象のパス（キー）
   * @returns なし
   */
  protected async deletePayload(key: string): Promise<void> {
    await this.payloadDS.delete(key);
  }
}
