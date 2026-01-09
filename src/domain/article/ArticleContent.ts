import { z } from 'zod';
import { zInt } from '@/shared/validation/zod';

/**
 * Content Section
 * 記事本文内の論理的な見出し区切り。
 * glossary: ContentSection に対応
 */
export type ContentSection = {
  /** アンカーID */
  id: string;
  /** 表示用テキスト */
  heading: string;
  /** 見出しレベル (2〜6) */
  level: number;
  /** 子セクション */
  children?: ContentSection[];
};

/**
 * Content Section Schema
 * 再帰的な構造をサポートするため z.lazy を使用し、ContentSection 型と同期させる。
 */
export const ContentSectionSchema: z.ZodType<ContentSection> = z.lazy(() =>
  z.object({
    id: z.string().min(1).max(64),
    heading: z.string().min(1).max(50),
    level: zInt().min(2).max(6),
    children: z.array(ContentSectionSchema).optional(),
  }),
);

/**
 * 記事の目次構造 (Table of Contents)
 * glossary: ContentStructure に対応
 */
export const ContentStructureSchema = z.array(ContentSectionSchema);

export type ContentStructure = z.infer<typeof ContentStructureSchema>;

/**
 * Article Content
 * 記事の実体データ。
 * glossary: ArticleContent に対応
 */
export const ArticleContentSchema = z.object({
  /** 記事の本文 (MDX形式の生テキスト。上限10万文字) */
  body: z.string().max(100000),
  /** 記事の目次構造 (ToC) */
  structure: ContentStructureSchema,
});

export type ArticleContent = z.infer<typeof ArticleContentSchema>;
