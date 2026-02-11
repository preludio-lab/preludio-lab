import { ArticleCategory } from '@/domain/article/article.metadata';
import { ArticleSearchCriteria } from '@/domain/article/article.repository';
import { InferSelectModel } from 'drizzle-orm';
import { articles, articleTranslations } from '../../database/schema/articles';

export type ArticleRow = InferSelectModel<typeof articles>;
export type TranslationRow = InferSelectModel<typeof articleTranslations>;

export interface ArticleMetadataRow {
  articles: ArticleRow;
  article_translations: TranslationRow;
}

export interface IArticleMetadataDataSource {
  /**
   * IDと言語コードを指定して記事のメタデータを取得します。
   */
  findById(id: string, lang: string): Promise<ArticleMetadataRow | undefined>;

  /**
   * スラッグと言語コードを指定して記事のメタデータを取得します。
   */
  findBySlug(
    slug: string,
    lang: string,
    category?: ArticleCategory,
  ): Promise<ArticleMetadataRow | undefined>;

  /**
   * 指定された検索条件に基づいて記事メタデータの一覧を取得します。
   */
  findMany(criteria: ArticleSearchCriteria): Promise<{
    rows: ArticleMetadataRow[];
    totalCount: number;
  }>;
}
