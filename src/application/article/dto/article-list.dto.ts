import { z } from 'zod';
import { ArticleSummarySchema } from '@/domain/article/article.schema';

/**
 * Article List Item DTO
 * 管理画面のリストや、詳細な情報が必要な一覧表示で使用するDTO。
 * ArticleSummarySchema (Domain) をベースに、JSONシリアライズ用に調整しています。
 */
export const ArticleListItemDtoSchema = ArticleSummarySchema.extend({
  /**
   * 正式な公開日時 (ISO8601 string)
   * Domain層では Date ですが、JSON転送用に文字列化します。
   */
  publishedAt: z.string().nullable(),
});

export type ArticleListItemDto = z.infer<typeof ArticleListItemDtoSchema>;

/**
 * Article Card DTO
 * 一般ユーザー向けの一覧（カードUI）表示に最適化された軽量DTO。
 * 必要な情報のみをピックアップしています。
 */
export const ArticleCardDtoSchema = ArticleListItemDtoSchema.pick({
  id: true,
  lang: true,
  slug: true,
  category: true,
  title: true,
  displayTitle: true,
  composerName: true,
  workTitle: true,
  excerpt: true,
  thumbnail: true,
  readingTimeSeconds: true,
  publishedAt: true,
  viewCount: true,
  likeCount: true,
  tags: true,
  readingLevel: true,
  performanceDifficulty: true,
  playback: true,
});

export type ArticleCardDto = z.infer<typeof ArticleCardDtoSchema>;
