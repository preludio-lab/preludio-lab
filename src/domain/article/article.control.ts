import { z } from '@/shared/validation/zod';
import { AppLocale } from '../i18n/locale';
import { Id } from '@/shared/id';

/**
 * Article Entity ID
 */
export type ArticleId = Id<'Article'>;

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
  /** 記事のユニークID (特定の言語版を一意に識別) (UUID v7) */
  id: z.string().uuid(),
  /** マスター記事ID (全言語版で共有されるアイデンティティ) (UUID v7推奨) */
  masterId: z.string().uuid(),
  /** 言語コード */
  lang: z.string().min(1).max(10) as z.ZodType<AppLocale>, // Assuming AppLocale is a string-based type
  /** 公開・管理状態 */
  status: z.nativeEnum(ArticleStatus),
  /** 記事の作成日時 */
  createdAt: z.coerce.date(),
  /** 記事の最終更新日時 */
  updatedAt: z.coerce.date(),
});

export type ArticleControl = Omit<z.infer<typeof ArticleControlSchema>, 'id' | 'masterId'> & {
  id: ArticleId;
  masterId: ArticleId;
};
