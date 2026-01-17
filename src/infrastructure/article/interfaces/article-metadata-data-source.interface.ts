import { InferSelectModel } from 'drizzle-orm';
import { articles, articleTranslations } from '@/infrastructure/database/schema';
import { ArticleCategory } from '@/domain/article/article-metadata';
import { ArticleSearchCriteria } from '@/domain/article/article.repository';

type ArticleRow = InferSelectModel<typeof articles>;
type TranslationRow = InferSelectModel<typeof articleTranslations>;

export interface MetadataRow {
  articles: ArticleRow;
  article_translations: TranslationRow;
}

export interface IArticleMetadataDataSource {
  /**
   * IDと言語コードを指定して記事のメタデータを取得します。
   *
   * @param id 記事ID
   * @param lang 言語コード
   * @returns 記事メタデータと翻訳データのペア。存在しない場合は undefined
   */
  findById(id: string, lang: string): Promise<MetadataRow | undefined>;

  /**
   * スラッグと言語コードを指定して記事のメタデータを取得します。
   *
   * @param slug 記事のスラッグ
   * @param lang 言語コード
   * @param category 記事カテゴリ（オプション）
   * @returns 記事メタデータと翻訳データのペア。存在しない場合は undefined
   */
  findBySlug(
    slug: string,
    lang: string,
    category?: ArticleCategory,
  ): Promise<MetadataRow | undefined>;

  /**
   * 指定された検索条件に基づいて記事メタデータの一覧を取得します。
   *
   * @param criteria 検索条件
   * @returns 検索結果の行配列と、条件に合致する総件数を含むオブジェクト
   */
  findMany(criteria: ArticleSearchCriteria): Promise<{
    rows: MetadataRow[];
    totalCount: number;
  }>;
}
