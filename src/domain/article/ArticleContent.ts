import { z } from 'zod';

/**
 * Content Section
 * 記事本文内の論理的な見出し区切り。
 * glossary: ContentSection に対応
 */
export const ContentSectionSchema: z.ZodType<any> = z.lazy(() => z.object({
    /** アンカーID */
    id: z.string().min(1),
    /** 表示用テキスト */
    heading: z.string().min(1),
    /** 見出しレベル (2〜6) */
    level: z.number().int().min(2).max(6),
    /** 子セクション */
    children: z.array(ContentSectionSchema).optional(),
}));

/**
 * 記事の目次構造 (Table of Contents)
 * glossary: ContentStructure に対応
 */
export const ContentStructureSchema = z.array(ContentSectionSchema);

/** 
 * Article Content
 * 記事の実体データ。
 * glossary: ArticleContent に対応
 */
export const ArticleContentSchema = z.object({
    /** 記事の本文 (MDX形式の生テキスト) */
    body: z.string(),
    /** 記事の目次構造 (ToC) */
    structure: ContentStructureSchema,
});

export type ContentSection = {
    id: string;
    heading: string;
    level: number;
    children?: ContentSection[];
};
export type ContentStructure = ContentSection[];
export type ArticleContent = z.infer<typeof ArticleContentSchema>;
