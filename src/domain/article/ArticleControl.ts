import { z } from 'zod';
import { AppLocale } from '../i18n/Locale';

/**
 * Article Status
 * 記事の公開状態
 */
export const ArticleStatus = {
    /** 公開済み */
    PUBLISHED: 'published',
    /** 下書き (管理画面のみ) */
    DRAFT: 'draft',
    /** 非公開 (URLを知っている人のみ) */
    PRIVATE: 'private',
    /** アーカイブ済み (一覧に非表示) */
    ARCHIVED: 'archived',
} as const;

export type ArticleStatus = (typeof ArticleStatus)[keyof typeof ArticleStatus];

/**
 * Article Control
 * 記事の基本識別情報とライフサイクル管理。
 * glossary: ArticleControl に対応
 */
export const ArticleControlSchema = z.object({
    /** 記事のユニークID (システム内部用) */
    id: z.string().min(1),
    /** 言語コード */
    lang: z.string().min(1) as z.ZodType<AppLocale>, // Assuming AppLocale is a string-based type
    /** 公開・管理状態 */
    status: z.nativeEnum(ArticleStatus),
    /** 記事の作成日時 */
    createdAt: z.coerce.date(),
    /** 記事の最終更新日時 */
    updatedAt: z.coerce.date(),
});

export type ArticleControl = z.infer<typeof ArticleControlSchema>;
