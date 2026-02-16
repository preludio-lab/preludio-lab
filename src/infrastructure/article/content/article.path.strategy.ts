import { ArticleSummary } from '@/domain/article/article';

/**
 * 記事コンテンツのストレージパスを解決するための戦略インターフェース。
 */
export interface IArticlePathStrategy {
  /**
   * 記事サマリーに基づいて、ストレージ上のパス（キー）を解決します。
   *
   * @param summary 記事サマリー
   * @returns ストレージパス
   */
  resolvePath(summary: ArticleSummary): string;
}

/**
 * 標準的な記事コンテンツのパス解決戦略。
 * 開発環境やファイルシステムベースの管理に適した階層構造を提供します。
 *
 * パス形式: `[category]/[slug]/mdx/[lang].mdx`
 */
export class ArticlePathStrategy implements IArticlePathStrategy {
  /**
   * 記事のメタデータに基づいてパスを生成します。
   *
   * @param summary 記事サマリー
   * @returns 解決されたパス
   */
  resolvePath(summary: ArticleSummary): string {
    const { category, slug } = summary.metadata;
    const { lang } = summary.control;

    // TODO: 将来的には環境変数や設定に基づいて階層構造を変更できるように拡張可能
    return `${category}/${slug}/mdx/${lang}.mdx`;
  }
}
