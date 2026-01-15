import { eq, and } from 'drizzle-orm';
import { db } from '../database/turso-client';
import { articles, articleTranslations } from '../database/schema';

export class ArticleMetadataDataSource {
  /**
   * Find raw article data by ID and Language
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
   * Find raw article data by Slug and Language
   */
  async findBySlug(slug: string, lang: string) {
    const result = await db
      .select()
      .from(articles)
      .innerJoin(articleTranslations, eq(articles.id, articleTranslations.articleId))
      .where(and(eq(articles.slug, slug), eq(articleTranslations.lang, lang)))
      .limit(1);

    return result[0] || null;
  }
}
