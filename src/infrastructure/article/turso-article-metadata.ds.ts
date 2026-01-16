import { eq, and, desc, sql, InferSelectModel } from 'drizzle-orm';
import { db } from '../database/turso-client';
import { articles, articleTranslations } from '../database/schema';
import { ArticleCategory } from '@/domain/article/ArticleMetadata';
import { ArticleStatus } from '@/domain/article/ArticleControl';

export type ArticleRow = InferSelectModel<typeof articles>;
export type TranslationRow = InferSelectModel<typeof articleTranslations>;

export interface MetadataRow {
  articles: ArticleRow;
  article_translations: TranslationRow;
}

export class ArticleMetadataDataSource {
  /**
   * IDと言語で記事の生データを取得する
   * 公開・非公開に関わらず取得する（詳細ページやプレビュー用）
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
   * Slugと言語で記事の生データを取得する
   * 公開・非公開に関わらず取得する
   * カテゴリも条件に含む
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
   * 検索条件に基づいて記事メタデータ一覧を取得する
   * ユーザー向けリストのため、PUBLISHED (公開済み) の記事のみを返す
   */
  async findMany(criteria: {
    lang: string;
    category?: ArticleCategory;
    limit?: number;
    offset?: number;
  }) {
    // フィルタリング条件: 言語 + 公開ステータス
    const filters = [
      eq(articleTranslations.lang, criteria.lang),
      eq(articleTranslations.status, ArticleStatus.PUBLISHED),
    ];

    if (criteria.category) {
      filters.push(eq(articles.category, criteria.category));
    }

    // クエリ1: データ取得
    const rowsQuery = db
      .select()
      .from(articles)
      .innerJoin(articleTranslations, eq(articles.id, articleTranslations.articleId))
      .where(and(...filters))
      .orderBy(desc(articleTranslations.publishedAt)) // 新しい順
      .limit(criteria.limit || 20)
      .offset(criteria.offset || 0);

    // クエリ2: 総件数取得 (Count)
    // パフォーマンスのため必要なフィールドのみ結合またはCOUNT(*)最適化
    const countQuery = db
      .select({ count: sql<number>`count(*)` })
      .from(articles)
      .innerJoin(articleTranslations, eq(articles.id, articleTranslations.articleId))
      .where(and(...filters));

    // 並列実行で高速化
    const [rows, countResult] = await Promise.all([rowsQuery, countQuery]);

    return {
      rows,
      totalCount: Number(countResult[0]?.count || 0),
    };
  }
}
