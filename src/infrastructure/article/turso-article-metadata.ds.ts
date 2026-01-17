import { eq, and, desc, asc, inArray, like, or, sql, InferSelectModel } from 'drizzle-orm';
import { db } from '../database/turso-client';
import { articles, articleTranslations } from '../database/schema';
import { ArticleCategory } from '@/domain/article/ArticleMetadata';
import { ArticleStatus } from '@/domain/article/ArticleControl';
import { ArticleSearchCriteria, ArticleKeywordScope } from '@/domain/article/ArticleRepository';
import { ArticleSortOption, SortDirection } from '@/domain/article/ArticleConstants';

export type ArticleRow = InferSelectModel<typeof articles>;
export type TranslationRow = InferSelectModel<typeof articleTranslations>;

export interface MetadataRow {
  articles: ArticleRow;
  article_translations: TranslationRow;
}

export class ArticleMetadataDataSource {
  /**
   * IDと言語コードを指定して記事のメタデータを取得します。
   * 公開ステータスに関わらず、指定されたIDの記事が存在すれば返却します。
   * 詳細ページやプレビュー表示で使用されます。
   *
   * @param id 記事ID
   * @param lang 言語コード
   * @returns 記事メタデータと翻訳データのペア。存在しない場合は undefined
   */
  async findById(id: string, lang: string): Promise<MetadataRow | undefined> {
    const result = await db
      .select()
      .from(articles)
      .innerJoin(articleTranslations, eq(articles.id, articleTranslations.articleId))
      .where(and(eq(articles.id, id), eq(articleTranslations.lang, lang)))
      .limit(1);

    return result[0];
  }

  /**
   * スラッグと言語コードを指定して記事のメタデータを取得します。
   * 任意でカテゴリを指定して絞り込むことも可能です。
   * 公開ステータスに関わらず取得します。
   *
   * @param slug 記事のスラッグ
   * @param lang 言語コード
   * @param category 記事カテゴリ（オプション）
   * @returns 記事メタデータと翻訳データのペア。存在しない場合は undefined
   */
  async findBySlug(
    slug: string,
    lang: string,
    category?: ArticleCategory, // 型をEnumに厳格化
  ): Promise<MetadataRow | undefined> {
    // string で渡ってきた場合に備えて Enum として扱う
    const filters = [eq(articles.slug, slug), eq(articleTranslations.lang, lang)];

    if (category) {
      filters.push(eq(articles.category, category));
    }

    const result = await db
      .select()
      .from(articles)
      .innerJoin(articleTranslations, eq(articles.id, articleTranslations.articleId))
      .where(and(...filters))
      .limit(1);

    return result[0];
  }

  /**
   * 指定された検索条件に基づいて記事メタデータの一覧を取得します。
   * ページネーション、ソート、フィルタリング（カテゴリ、キーワード、ステータス等）に対応しています。
   *
   * @param criteria 検索条件（フィルタ、ソート、ページネーション設定が含まれるオブジェクト）
   * @returns 検索結果の行配列と、条件に合致する総件数を含むオブジェクト
   */
  async findMany(criteria: ArticleSearchCriteria) {
    const { filter, sort, pagination } = criteria;
    const filters = [];

    // --- 1. Filter Construction ---

    // 言語 (必須)
    filters.push(eq(articleTranslations.lang, filter.lang));

    // ステータス (指定がなければ PUBLISHED のみ)
    const targetStatuses = filter.status || [ArticleStatus.PUBLISHED];
    if (targetStatuses.length > 0) {
      filters.push(inArray(articleTranslations.status, targetStatuses));
    }

    // カテゴリ
    if (filter.category) {
      filters.push(eq(articles.category, filter.category));
    }

    // featured
    if (filter.isFeatured !== undefined) {
      filters.push(eq(articleTranslations.isFeatured, filter.isFeatured));
    }

    // キーワード検索
    if (filter.keyword) {
      const pattern = `%${filter.keyword}%`;
      const scope = filter.keywordScope || ArticleKeywordScope.ALL;
      const keywordConditions = [];

      if (scope === ArticleKeywordScope.TITLE || scope === ArticleKeywordScope.ALL) {
        keywordConditions.push(like(articleTranslations.title, pattern));
        keywordConditions.push(like(articleTranslations.displayTitle, pattern));
      }

      if (scope === ArticleKeywordScope.SUMMARY || scope === ArticleKeywordScope.ALL) {
        // catchcopy, excerpt, and maybe body digest if available?
        // Using excerpt and catchcopy for now
        keywordConditions.push(like(articleTranslations.excerpt, pattern));
        if (articleTranslations.catchcopy) {
          keywordConditions.push(like(articleTranslations.catchcopy, pattern));
        }
      }

      if (keywordConditions.length > 0) {
        filters.push(or(...keywordConditions));
      }
    }

    // --- 2. Sort Strategy ---

    let orderByClause;
    const direction = sort?.direction === SortDirection.ASC ? asc : desc;

    // デフォルトは公開日
    const sortField = sort?.field || ArticleSortOption.PUBLISHED_AT;

    switch (sortField) {
      case ArticleSortOption.TITLE:
        orderByClause = direction(articleTranslations.displayTitle);
        break;
      case ArticleSortOption.PERFORMANCE_DIFFICULTY:
        orderByClause = direction(articleTranslations.slPerformanceDifficulty); // assuming schema mapping
        break;
      case ArticleSortOption.PUBLISHED_AT:
      default:
        orderByClause = direction(articleTranslations.publishedAt);
        break;
    }

    // --- 3. Execution ---

    // クエリ1: データ取得
    const rowsQuery = db
      .select()
      .from(articles)
      .innerJoin(articleTranslations, eq(articles.id, articleTranslations.articleId))
      .where(and(...filters))
      .orderBy(orderByClause)
      .limit(pagination.limit)
      .offset(pagination.offset);

    // クエリ2: 総件数取得 (Count)
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .innerJoin(articleTranslations, eq(articles.id, articleTranslations.articleId))
      .where(and(...filters));

    const [rows, countResult] = await Promise.all([rowsQuery, countQuery]);

    return {
      rows,
      totalCount: Number(countResult[0]?.count || 0),
    };
  }
}
