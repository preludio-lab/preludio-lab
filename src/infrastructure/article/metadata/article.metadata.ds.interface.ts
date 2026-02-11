import { Article } from '@/domain/article/article';
import { ArticleCategory } from '@/domain/article/article.metadata';
import { ArticleSearchCriteria } from '@/domain/article/article.repository';

export interface IArticleMetadataDataSource {
  /**
   * IDと言語コードを指定して記事のメタデータを取得し、Articleドメインオブジェクト（本文なし）を返します。
   */
  findById(id: string, lang: string): Promise<Article | undefined>;

  /**
   * スラッグと言語コードを指定して記事のメタデータを取得し、Articleドメインオブジェクト（本文なし）を返します。
   */
  findBySlug(slug: string, lang: string, category?: ArticleCategory): Promise<Article | undefined>;

  /**
   * 指定された検索条件に基づいて記事メタデータの一覧を取得します。
   */
  findMany(criteria: ArticleSearchCriteria): Promise<{
    items: Article[];
    totalCount: number;
  }>;
}
