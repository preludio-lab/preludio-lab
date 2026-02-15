import { ArticleContent, ContentStructure } from '@/domain/article/article';
import { preprocessMdx } from './mdx.preprocessor';

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
   * @param structure - メタデータとして保存されている目次構造
   */
  static toDomain(rawMdx: string | null, structure: ContentStructure): ArticleContent {
    const body = rawMdx ? preprocessMdx(rawMdx) : null;
    return new ArticleContent({
      body: body,
      structure: structure,
    });
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
}
