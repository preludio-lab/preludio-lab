import { Article } from '@/domain/article/article';

/**
 * 記事コンテンツの論理ストレージパスを解決するための戦略クラス。
 */
export class ArticlePathStrategy {
  /**
   * 記事のMDXコンテンツの論理パスを解決します。
   *
   * 論理構造: {category}/{slug}/mdx/{lang}.mdx
   *
   * @param article メタデータと制御情報を含む記事ドメインオブジェクト
   * @returns ストレージ用の論理パスキー
   */
  resolvePath(article: Article): string {
    const { category, slug } = article.metadata;
    const { lang } = article.control;

    return `${category}/${slug}/mdx/${lang}.mdx`;
  }
}
