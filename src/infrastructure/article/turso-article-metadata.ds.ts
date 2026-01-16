import { eq, and, InferSelectModel } from 'drizzle-orm';
import { db } from '../database/turso-client';
import { articles, articleTranslations } from '../database/schema';

export type ArticleRow = InferSelectModel<typeof articles>;
export type TranslationRow = InferSelectModel<typeof articleTranslations>;

export interface MetadataRow {
  articles: ArticleRow;
  article_translations: TranslationRow;
}

export class ArticleMetadataDataSource {
  /**
   * IDと言語で記事の生データを取得する
   */
  async findById(id: string, lang: string) {
    const result = await db
      .select()
      .from(articles)
      .innerJoin(articleTranslations, eq(articles.id, articleTranslations.articleId))
      .where(and(eq(articles.id, id), eq(articleTranslations.lang, lang)))
      .limit(1);

    return result[0] || null;
  }

  /**
   * Slugと言語で記事の生データを取得する
   */
  /**
   * Slugと言語で記事の生データを取得する
   * カテゴリも条件に含む
   */
  async findBySlug(slug: string, lang: string, category?: string) {
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

    return result[0] || null;
  }

  /**
   * 検索条件に基づいて記事メタデータ一覧を取得する
   */
  async findMany(criteria: { lang: string; category?: string; limit?: number; offset?: number }) {
    const filters = [eq(articleTranslations.lang, criteria.lang)];

    if (criteria.category) {
      filters.push(eq(articles.category, criteria.category));
    }

    // TODO: その他検索条件の実装 (Status, Tags, etc.)

    const rows = await db
      .select()
      .from(articles)
      .innerJoin(articleTranslations, eq(articles.id, articleTranslations.articleId))
      .where(and(...filters))
      .limit(criteria.limit || 20)
      .offset(criteria.offset || 0);

    // Count query (simplified)
    /*
     const totalCount = await db
       .select({ count: count() })
       .from(articles)
       .innerJoin(articleTranslations, eq(articles.id, articleTranslations.articleId))
       .where(and(...filters));
    */
    // 今回はTotalCountは簡易実装または別メソッドとするか、一旦0で返す
    // ※ 厳密なCountは重いため、設計に応じて別途考慮が必要

    return { rows, totalCount: 0 }; // Temporary zero count
  }
}
