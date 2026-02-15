import {
  Article,
  ArticleContent,
  ArticleSummary,
  ContentSection,
  ContentStructure,
} from '@/domain/article/article';

/**
 * 記事コンテンツ（MDX）の変換を担うマッパー
 *
 * 生のMDX文字列とヘッダー構造情報（メタデータ由来）を組み合わせて
 * ArticleContent ドメインエンティティを生成します。
 */
export class ArticleContentMapper {
  /**
   * MDX文字列と構造データからドメインエンティティを生成します。
   *
   * @param rawMdx - ストレージから取得したMDX生データ
   * @param structure - (オプション) 目次構造。省略された場合はMDXから解析します。
   */
  static toDomain(rawMdx: string | null, structure?: ContentStructure): ArticleContent {
    const body = rawMdx;
    const resolvedStructure = structure || (rawMdx ? this.parseStructure(rawMdx) : []);

    return new ArticleContent({
      body: body,
      structure: resolvedStructure,
    });
  }

  /**
   * MDX文字列を解析して見出し構造（H2〜H6）を抽出します。
   *
   * @param mdx - 解析対象のMDX文字列
   * @returns 抽出された目次構造
   */
  private static parseStructure(mdx: string): ContentStructure {
    const headingRegex = /^(#{2,6})\s+(.+)$/gm;
    const sections: ContentSection[] = [];
    let match;

    while ((match = headingRegex.exec(mdx)) !== null) {
      const level = match[1].length;
      const heading = match[2].trim();
      // ID生成ロジック (簡易版: 特殊文字削除と小文字化)
      const id = heading
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-');

      sections.push({
        id,
        heading,
        level,
      });
    }

    // フラットなリストを暫定的に返却
    return sections;
  }

  /**
   * ドメインエンティティから永続化用のMDX文字列を抽出します。
   *
   * @param content - 記事コンテンツエンティティ
   * @returns 保存またはキャッシュ用のMDX文字列
   */
  static toPersistence(content: ArticleContent): string | null {
    return content.body;
  }

  /**
   * 記事のMDXコンテンツの論理ストレージパスを解決します。
   *
   * @param article メタデータと制御情報を含む記事ドメインオブジェクト
   * @returns ストレージ用の論理パスキー
   */
  static resolvePath(article: Article | ArticleSummary): string {
    const { category, slug } = article.metadata;
    const { lang } = article.control;

    return `${category}/${slug}/mdx/${lang}.mdx`;
  }
}
