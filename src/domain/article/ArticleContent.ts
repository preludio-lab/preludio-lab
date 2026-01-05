/**
 * Content Section
 * 記事本文内の論理的な見出し区切り。
 * glossary: ContentSection に対応
 */
export type ContentSection = {
    /** 
     * アンカーID (例: "historical-background") 
     * DOM IDとして使用され、ページ内リンク（アンカー）の対象となる。
     * 原則としてURLセーフなSlug形式。
     */
    id: string;
    /** 
     * 目次に表示される見出しテキスト (例: "歴史的背景") 
     */
    heading: string;
    /** 
     * 見出しレベル (2〜6)
     * 記事タイトルが h1 であるため、本文内のセクションは h2 (2) から開始する。
     */
    level: number;
    /** 
     * 子セクション。
     * ネストされた見出し構造を表現する。
     */
    children?: ContentSection[];
};

/** 
 * 記事の目次構造 (Table of Contents) 
 * glossary: ContentStructure に対応
 */
export type ContentStructure = ContentSection[];

/** 
 * Article Content
 * 記事の実体データ。
 * glossary: ArticleContent に対応
 */
export type ArticleContent = {
    /** 
     * 記事の本文 (MDX形式の生テキスト)
     * glossary: ContentBody に対応
     */
    readonly body: string;
    /** 
     * 記事の目次構造 (ToC)
     * glossary: ContentStructure に対応
     */
    readonly structure: ContentStructure;
};
