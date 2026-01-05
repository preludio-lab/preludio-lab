import { z } from 'zod';
import { ArticleCategory } from './ArticleMetadata';

/**
 * Monetization Type
 * 収益化要素の種別
 */
export const MonetizationType = {
    /** アフィリエイトリンク (楽譜、CD等) */
    AFFILIATE: 'affiliate',
    /** 自社ショップ商品 */
    SHOP: 'shop',
    /** その他 (ドネーション等) */
    OTHER: 'other',
} as const;

export type MonetizationType = (typeof MonetizationType)[keyof typeof MonetizationType];

/**
 * 記事生成や楽曲解説に使用した参考文献や一次情報の根拠
 * 用語集: Source Attribution
 */
export const SourceAttributionSchema = z.object({
    /** 出典のタイトル (例: "IMSLP - Symphony No.5 (Beethoven)") */
    title: z.string().min(1),
    /** 出典へのURL */
    url: z.string(),
    /** 提供サービス名 (IMSLP, Wikipedia, Henle 等) */
    provider: z.string().optional(),
});

export type SourceAttribution = z.infer<typeof SourceAttributionSchema>;

/**
 * 記事に紐付く収益化リンク（アフィリエイト、自社商品等）
 * 用語集: Monetization Element
 */
export const MonetizationElementSchema = z.object({
    /** 収益化要素の種別 (affiliate, shop 等) */
    type: z.nativeEnum(MonetizationType),
    /** ボタンやリンクに表示するラベル (例: "Amazonで楽譜を見る") */
    label: z.string().min(1),
    /** リンク先URL */
    url: z.string().url(),
});

export type MonetizationElement = z.infer<typeof MonetizationElementSchema>;

/**
 * Series Assignment
 * シリーズへの所属情報
 */
export const SeriesAssignmentSchema = z.object({
    /** シリーズID (UUID等) */
    seriesId: z.string().uuid().or(z.string().min(1)),
    /** シリーズのスラグ (URL用) */
    seriesSlug: z.string().min(1),
    /** シリーズのタイトル (スナップショット) */
    seriesTitle: z.string().min(1),
    /** シリーズ内での表示順序 */
    order: z.number().int().nonnegative(),
});

export type SeriesAssignment = z.infer<typeof SeriesAssignmentSchema>;

/**
 * Related Article
 * 記事の文脈に基づいた関連記事の参照。
 * glossary: RelatedArticle に対応
 */
export const RelatedArticleSchema = z.object({
    /** ターゲット記事のID */
    articleId: z.string().min(1),
    /** 表示用のタイトル (スナップショット) */
    title: z.string().min(1),
    /** 記事カテゴリ */
    category: z.nativeEnum(ArticleCategory),
    /** URLスラグ */
    slug: z.string().min(1),
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
    seriesAssignments: z.array(SeriesAssignmentSchema).default([]),
    /** 静的にリンクされた関連記事のリスト */
    relatedArticles: z.array(RelatedArticleSchema).default([]),
    /** 記事の信頼性を担保する参照元リンク */
    sourceAttributions: z.array(SourceAttributionSchema).default([]),
    /** 収益化要素のリスト */
    monetizationElements: z.array(MonetizationElementSchema).default([]),
});

export type ArticleContext = z.infer<typeof ArticleContextSchema>;
