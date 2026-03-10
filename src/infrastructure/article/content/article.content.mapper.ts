import { ArticleContent, ContentSection, ContentStructure } from '@/domain/article/article';
import matter from 'gray-matter';
import { serverLogger as logger } from '@/infrastructure/logging/server.logger';

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
   * @param slug - (オプション) 記事のスラッグ。ログ出力やエラー特定に使用します。
   */
  static toDomain(
    rawMdx: string | null,
    structure?: ContentStructure,
    slug?: string,
  ): ArticleContent {
    let body = rawMdx;

    if (rawMdx) {
      try {
        // 正常系: gray-matter でパースして本文のみ抽出
        const parsed = matter(rawMdx);
        body = parsed.content;
      } catch (error) {
        // 異常系: パース失敗時のフォールバック処理
        logger.error(
          `[ArticleContentMapper] Failed to parse MDX frontmatter for article: ${slug || 'unknown'}`,
          error as Error,
        );

        // Fallback Level 1: 正規表現による除去試行
        // 先頭の空白・改行を許容し、最短マッチでフロントマターを特定
        const match = rawMdx.match(/^\s*---[\r\n]+([\s\S]*?)[\r\n]+---/);
        if (match) {
          logger.warn(
            `[ArticleContentMapper] Recovered from gray-matter failure using Regex for article: ${slug || 'unknown'}`,
          );
          body = rawMdx.replace(match[0], '').trim();
        } else {
          // Fallback Level 2: 正規表現でも除去できない場合
          if (rawMdx.trim().startsWith('---')) {
            // コンテンツが '---' で始まっているのにパースできない -> フロントマター破損と判断
            // ユーザーへのメタデータ漏洩を防ぐため、空文字を返す (Fail-safe)
            logger.error(
              `[ArticleContentMapper] Frontmatter corrupted and unrecoverable. hiding content for safety. Article: ${slug || 'unknown'}`,
            );
            body = '';
          } else {
            // '---' で始まっていない -> 通常のMarkdownと判断し、原文を返す
            body = rawMdx;
          }
        }
      }
    }

    const resolvedStructure = structure || (body ? this.parseStructure(body) : []);

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
    const rootSections: ContentSection[] = [];
    const stack: ContentSection[] = [];
    let match;

    while ((match = headingRegex.exec(mdx)) !== null) {
      const level = match[1].length;
      const heading = match[2].trim();

      // ID生成ロジック (日本語などの多言語対応)
      let id = heading
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-') // スペースをハイフンに置換
        .replace(/[^\p{L}\p{N}-]/gu, '') // Unicode文字（文字・数字）とハイフン以外を削除
        .replace(/-+/g, '-') // 連続するハイフンを1つにまとめる
        .replace(/^-|-$/g, ''); // 行頭・行末のハイフンを削除

      if (!id) {
        id = `section-${rootSections.length + stack.length + 1}`;
      }

      const newSection: ContentSection = {
        id,
        heading,
        level,
        children: [],
      };

      // 適切な親を見つける（現在の見出しよりレベルが低い＝数値が小さいアイテムをスタックに残す）
      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop();
      }

      if (stack.length === 0) {
        // 親がいない場合はルートに追加
        rootSections.push(newSection);
      } else {
        // スタックのトップにあるセクションの子として追加
        const parent = stack[stack.length - 1];
        parent.children = parent.children || [];
        parent.children.push(newSection);
      }

      // 自身をスタックに追加して、次の見出しの親候補にする
      stack.push(newSection);
    }

    return rootSections;
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
