import { z } from 'zod';
import { zInt } from '@/shared/validation/zod';
import { ArticleCategory } from './article.metadata';

import { UrlSchema, SlugSchema } from '../shared/common.metadata';

/**
 * 記事生成や楽曲解説に使用した参考文献や一次情報の根拠
 * 用語集: Source Attribution
 */
export const SourceAttributionSchema = z.object({
  /** 出典のタイトル (例: "IMSLP - Symphony No.5 (Beethoven)") */
  title: z.string().min(1).max(50),
  /** 出典へのURL */
  url: UrlSchema,
  /** 提供サービス名 (IMSLP, Wikipedia, Henle 等) */
  provider: z.string().max(50).optional(),
});

export type SourceAttribution = z.infer<typeof SourceAttributionSchema>;

import { MonetizationElementSchema } from '../monetization/monetization';

/**
 * Series Assignment
 * シリーズへの所属情報
 */
export const SeriesAssignmentSchema = z.object({
  /** シリーズID (UUID等) */
  seriesId: z.string().uuid().or(z.string().min(1).max(50)),
  /** シリーズのスラグ (URL用) */
  seriesSlug: SlugSchema,
  /** シリーズのタイトル (スナップショット) */
  seriesTitle: z.string().min(1).max(50),
  /** シリーズ内での表示順序 */
  order: zInt().nonnegative().max(9999),
});

export type SeriesAssignment = z.infer<typeof SeriesAssignmentSchema>;

/**
 * Related Article
 * 記事の文脈に基づいた関連記事の参照。
 * glossary: RelatedArticle に対応
 */
export const RelatedArticleSchema = z.object({
  /** ターゲット記事のID */
  articleId: z.string().min(1).max(50),
  /** 表示用のタイトル (スナップショット) */
  title: z.string().min(1).max(50),
  /** 記事カテゴリ */
  category: z.nativeEnum(ArticleCategory),
  /** URLスラグ */
  slug: SlugSchema,
  publishedAt: z.coerce.date().nullable().default(null),
});

export type RelatedArticle = z.infer<typeof RelatedArticleSchema>;

/**
 * Article Context
 * 記事の外部世界（根拠・ビジネス・繋がり）との関係定義。
 * glossary: ArticleContext に対応
 */
export const ArticleContextSchema = z.object({
  /** 所属するシリーズ情報のリスト */
  seriesAssignments: z.array(SeriesAssignmentSchema).max(100).default([]),
  /** 静的にリンクされた関連記事のリスト */
  relatedArticles: z.array(RelatedArticleSchema).max(20).default([]),
  /** 記事の信頼性を担保する参照元リンク */
  sourceAttributions: z.array(SourceAttributionSchema).max(20).default([]),
  /** 収益化要素のリスト */
  monetizationElements: z.array(MonetizationElementSchema).max(30).default([]),
});

export type ArticleContext = z.infer<typeof ArticleContextSchema>;
