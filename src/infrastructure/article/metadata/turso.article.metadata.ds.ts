import { eq, and, desc, asc, inArray, like, or, sql, AnyColumn } from 'drizzle-orm';
import { db } from '../../database/turso.client';
import { articles, articleTranslations } from '../../database/schema';
import { ArticleCategory } from '@/domain/article/article.metadata';
import { ArticleStatus } from '@/domain/article/article.control';
import { ArticleSearchCriteria, ArticleKeywordScope } from '@/domain/article/article.repository';
import { ArticleSortOption, SortDirection } from '@/domain/article/article.constants';
import { Logger } from '@/shared/logging/logger';
import { AppError } from '@/domain/shared/app-error';

import { IArticleMetadataDataSource, ArticleMetadataRow } from './article.metadata.ds';

/**
 * Turso (SQLite/libSQL) をバックエンドとした記事メタデータのデータソース実装。
 *
 * Drizzle ORM を使用して、マスターテーブル (articles) と
 * 翻訳テーブル (article_translations) の結合（JOIN）や検索を処理します。
 */
export class TursoArticleMetadataDataSource implements IArticleMetadataDataSource {
  constructor(private readonly logger: Logger) {}

  /**
   * マスターIDと言語コードを指定して記事のメタデータを1件取得します。
   * マスターレコードと該当言語の翻訳レコードを内部結合（INNER JOIN）して返します。
   *
   * @param id - 記事マスターID (UUID)
   * @param lang - 取得対象の言語コード
   */
  async findById(id: string, lang: string): Promise<ArticleMetadataRow | undefined> {
    try {
      const result = await db
        .select({
          articles: articles,
          article_translations: articleTranslations,
        })
        .from(articles)
        .innerJoin(articleTranslations, eq(articles.id, articleTranslations.articleId))
        .where(and(eq(articles.id, id), eq(articleTranslations.lang, lang)))
        .limit(1);

      return result[0] as ArticleMetadataRow | undefined;
    } catch (error) {
      this.logger.error('TursoArticleMetadataDataSource.findById error', error as Error, {
        id,
        lang,
      });
      throw new AppError(
        'Failed to retrieve article metadata by ID',
        'INFRASTRUCTURE_ERROR',
        500,
        error,
      );
    }
  }

  /**
   * スラッグと言語コードを指定して記事のメタデータを1件取得します。
   *
   * 【スラッグ解決の優先順位】
   * 1. 翻訳テーブル側の `slSlug` (ローカライズされたスラッグ) が一致する場合を最優先します。
   * 2. `slSlug` が NULL の場合のみ、マスターテーブル側の `slug` との一致をチェックします。
   * これにより、言語ごとのカスタムURLと、デフォルトURLの両方をサポートします。
   *
   * @param slug - 検索対象のスラッグ (パスの構成要素)
   * @param lang - 言語コード
   * @param category - (オプション) カテゴリによる追加絞り込み
   */
  async findBySlug(
    slug: string,
    lang: string,
    category?: ArticleCategory,
  ): Promise<ArticleMetadataRow | undefined> {
    try {
      // 検索ロジック:
      // 1. 翻訳側のスラッグ (slSlug) が一致する
      // 2. または、翻訳スラッグが未設定 (NULL) で、マスタースラッグ (articles.slug) が一致する (フォールバック)
      const slugCondition = or(
        eq(articleTranslations.slSlug, slug),
        and(sql`${articleTranslations.slSlug} IS NULL`, eq(articles.slug, slug)),
      );

      const filters = [slugCondition, eq(articleTranslations.lang, lang)];

      if (category) {
        filters.push(eq(articles.category, category));
      }

      const result = await db
        .select({
          articles: articles,
          article_translations: articleTranslations,
        })
        .from(articles)
        .innerJoin(articleTranslations, eq(articles.id, articleTranslations.articleId))
        .where(and(...filters))
        .limit(1);

      return result[0] as ArticleMetadataRow | undefined;
    } catch (error) {
      this.logger.error('TursoArticleMetadataDataSource.findBySlug error', error as Error, {
        slug,
        lang,
        category,
      });
      throw new AppError(
        'Failed to retrieve article metadata by slug',
        'INFRASTRUCTURE_ERROR',
        500,
        error,
      );
    }
  }

  /**
   * 検索条件に基づいて記事メタデータの一覧を表示用（サマリー形式）に取得します。
   * キーワード検索、ステータス、カテゴリ、おすすめ（Featured）などのフィルタを処理します。
   *
   * @param criteria - 検索とページネーションの条件
   * @returns 取得された行の一覧と、フィルタ条件に合致する総件数 (totalCount)
   */
  async search(
    criteria: ArticleSearchCriteria,
  ): Promise<{ rows: ArticleMetadataRow[]; totalCount: number }> {
    try {
      const { filter, sort, pagination } = criteria;
      const filters = [];

      // 1. 基本フィルタ (言語、ステータス)
      filters.push(eq(articleTranslations.lang, filter.lang));

      const targetStatuses = filter.status?.length ? filter.status : [ArticleStatus.PUBLISHED];
      filters.push(inArray(articleTranslations.status, targetStatuses));

      // 2. 追加属性フィルタ
      if (filter.category) {
        filters.push(eq(articles.category, filter.category));
      }

      if (filter.isFeatured !== undefined) {
        filters.push(eq(articleTranslations.isFeatured, filter.isFeatured));
      }

      // 3. キーワード検索ロジック
      // 指定されたスコープ（タイトルのみ、サマリーのみ、または両方）に基づいて LIKE 検索を構成します。
      if (filter.keyword) {
        const pattern = `%${filter.keyword}%`;
        const scope = filter.keywordScope || ArticleKeywordScope.ALL;
        const keywordConditions = [];

        const searchTitle =
          scope === ArticleKeywordScope.TITLE || scope === ArticleKeywordScope.ALL;
        const searchSummary =
          scope === ArticleKeywordScope.SUMMARY || scope === ArticleKeywordScope.ALL;

        if (searchTitle) {
          keywordConditions.push(like(articleTranslations.title, pattern));
          keywordConditions.push(like(articleTranslations.displayTitle, pattern));
        }

        if (searchSummary) {
          keywordConditions.push(like(articleTranslations.excerpt, pattern));
          keywordConditions.push(like(articleTranslations.catchcopy, pattern));
        }

        if (keywordConditions.length > 0) {
          filters.push(or(...keywordConditions));
        }
      }

      // 4. ソート設定
      const sortMapping: Partial<Record<ArticleSortOption, AnyColumn>> = {
        [ArticleSortOption.TITLE]: articleTranslations.displayTitle,
        [ArticleSortOption.PERFORMANCE_DIFFICULTY]: articleTranslations.slPerformanceDifficulty,
        [ArticleSortOption.PUBLISHED_AT]: articleTranslations.publishedAt,
      };

      const sortField = sort?.field || ArticleSortOption.PUBLISHED_AT;
      const targetColumn = sortMapping[sortField] ?? articleTranslations.publishedAt;

      const direction = sort?.direction === SortDirection.ASC ? asc : desc;
      const orderByClause = direction(targetColumn);

      // 5. データ取得とカウントの並列実行
      const rowsPromise = db
        .select({
          articles: articles,
          article_translations: articleTranslations,
        })
        .from(articles)
        .innerJoin(articleTranslations, eq(articles.id, articleTranslations.articleId))
        .where(and(...filters))
        .orderBy(orderByClause)
        .limit(pagination.limit)
        .offset(pagination.offset);

      const countPromise = db
        .select({ count: sql<number>`count(*)` })
        .from(articles)
        .innerJoin(articleTranslations, eq(articles.id, articleTranslations.articleId))
        .where(and(...filters));

      const [rows, countResult] = await Promise.all([rowsPromise, countPromise]);

      return {
        rows: rows as ArticleMetadataRow[],
        totalCount: Number(countResult[0]?.count || 0),
      };
    } catch (error) {
      this.logger.error('TursoArticleMetadataDataSource.search error', error as Error, {
        criteria,
      });
      throw new AppError(
        'Failed to retrieve article metadata list',
        'INFRASTRUCTURE_ERROR',
        500,
        error,
      );
    }
  }

  /**
   * 記事メタデータ（マスターおよび該当言語の翻訳）を保存します。
   * 現在はアーキテクチャ定義のみで、実体は後ほど実装予定です。
   *
   * 【実装上の注意】
   * 特定の言語の翻訳のみを保存する場合、マスターテーブル (articles) のデータ
   * （スラッグ、サムネイル、作成日時など）を誤って破壊（初期値で上書き）しないように、
   * `onConflictDoUpdate` 等を用いて更新対象を限定する必要があります。
   */
  async save(_row: ArticleMetadataRow): Promise<void> {
    // アーキテクチャ構成を優先し、現在はスキャフォールディング（実体は後ほど実装）
    this.logger.info(`TursoArticleMetadataDataSource.save called for ID: ${_row.articles.id}`);
    // TODO: Perform db.insert().onConflictDoUpdate() or equivalent
    // [Implementation Note]
    // Master data (articles table) should only be updated when specifically intended.
    // Use onConflictDoUpdate to control which columns are updated to prevent overwriting
    // master attributes (slug, thumbnail, etc.) when saving a translation.
  }

  /**
   * 特定の言語の翻訳レコードを削除します。
   *
   * @param id - 親となるマスターID
   * @param lang - 削除対象の言語
   */
  async deleteTranslation(id: string, lang: string): Promise<void> {
    try {
      await db
        .delete(articleTranslations)
        .where(and(eq(articleTranslations.articleId, id), eq(articleTranslations.lang, lang)));
      this.logger.info(`Deleted translation for article: ${id} [${lang}]`);
    } catch (error) {
      this.logger.error('TursoArticleMetadataDataSource.deleteTranslation error', error as Error, {
        id,
        lang,
      });
      throw new AppError(
        'Failed to delete article translation',
        'INFRASTRUCTURE_ERROR',
        500,
        error,
      );
    }
  }

  /**
   * 指定されたマスターIDに紐付けられている全言語の翻訳レコード総数を返します。
   * 全言語の翻訳が削除された際にマスターを削除するかどうかの判定に使用されます。
   *
   * @param id - 調査対象のマスターID
   */
  async countTranslations(id: string): Promise<number> {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(articleTranslations)
        .where(eq(articleTranslations.articleId, id));

      return Number(result[0]?.count || 0);
    } catch (error) {
      this.logger.error('TursoArticleMetadataDataSource.countTranslations error', error as Error, {
        id,
      });
      throw new AppError(
        'Failed to count article translations',
        'INFRASTRUCTURE_ERROR',
        500,
        error,
      );
    }
  }

  /**
   * 指定されたマスターIDに関連する全言語のメタデータを一括取得します。
   * 記事の「全言語での管理状態」を把握するために使用されます。
   *
   * @param id - マスターID
   */
  async findAllTranslations(id: string): Promise<ArticleMetadataRow[]> {
    try {
      const result = await db
        .select({
          articles: articles,
          article_translations: articleTranslations,
        })
        .from(articles)
        .innerJoin(articleTranslations, eq(articles.id, articleTranslations.articleId))
        .where(eq(articles.id, id));

      return result as ArticleMetadataRow[];
    } catch (error) {
      this.logger.error(
        'TursoArticleMetadataDataSource.findAllTranslations error',
        error as Error,
        {
          id,
        },
      );
      throw new AppError(
        'Failed to find all article translations',
        'INFRASTRUCTURE_ERROR',
        500,
        error,
      );
    }
  }

  /**
   * 指定されたマスターIDに紐づく全てのデータ（マスターおよび全言語の翻訳）を
   * トランザクションを用いて物理削除します。
   *
   * @param id - 削除対象のマスターID
   */
  async deleteAll(id: string): Promise<void> {
    try {
      // 外部キー制約（ON DELETE CASCADE）が設定されている場合は articles を消すだけで良いが、
      // 念のため明示的に両方消す。
      await db.transaction(async (tx) => {
        await tx.delete(articleTranslations).where(eq(articleTranslations.articleId, id));
        await tx.delete(articles).where(eq(articles.id, id));
      });
      this.logger.info(`Permanently deleted article and all translations: ${id}`);
    } catch (error) {
      this.logger.error('TursoArticleMetadataDataSource.deleteAll error', error as Error, { id });
      throw new AppError(
        'Failed to delete article master and translations',
        'INFRASTRUCTURE_ERROR',
        500,
        error,
      );
    }
  }
}
