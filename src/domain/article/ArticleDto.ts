import { z } from 'zod';
import { ArticleMetadata, SourceAttribution, MonetizationElement, Playback, ArticleMetadataSchema, PlaybackSchema, SourceAttributionSchema, MonetizationElementSchema } from './ArticleMetadata';
import { ArticleStatus, ArticleCategory } from './ArticleConstants';
import { AppLocale } from '../i18n/Locale';

/**
 * Article Engagement DTO
 * 一覧表示等でソーシャルプルーフとして表示される指標群
 */
export const ArticleEngagementDtoSchema = z.object({
    /** 累計閲覧数 */
    viewCount: z.number().int().nonnegative(),
    /** 累計お気に入り数 */
    likeCount: z.number().int().nonnegative(),
});

export type ArticleEngagementDto = z.infer<typeof ArticleEngagementDtoSchema>;

/**
 * Article Metadata DTO
 * 記事の構造化データ（Metadata）。一覧表示や検索結果、ヒーローセクションなどで使用される軽量モデル。
 * glossary: Article Metadata に対応。
 */
export const ArticleMetadataDtoSchema = z.object({
    /** 記事のユニークID */
    id: z.string(),
    /** URLスラグ */
    slug: z.string(),
    /** 言語コード */
    lang: z.string(), // AppLocale union
    /** 公開・管理状態 */
    status: z.nativeEnum(ArticleStatus),
    /** 記事カテゴリ */
    category: z.nativeEnum(ArticleCategory),
    /** 「おすすめ記事」フラグ */
    isFeatured: z.boolean().optional(),
    /** 公開日時 (ISO8601等) */
    publishedAt: z.string().nullable(),
    /** サムネイルのURLまたはパス */
    thumbnail: z.string().optional(),

    // Flattened Metadata for easier UI consumption
    /** UI表示タイトル */
    title: z.string(),
    /** 正式な表示用タイトル */
    displayTitle: z.string(),
    /** 作曲家名 */
    composerName: z.string().optional(),
    /** 作品タイトル */
    workTitle: z.string().optional(),
    /** 抜粋・概要文 */
    excerpt: z.string().optional(),

    // UX Indicators
    /** 推定読了時間 (秒) */
    readingTimeSeconds: z.number().int().nonnegative(),
    /** ユーザー向けのソーシャルプルーフ指標 */
    engagement: ArticleEngagementDtoSchema,
});

export type ArticleMetadataDto = z.infer<typeof ArticleMetadataDtoSchema>;

/**
 * Article Search Result DTO
 * 検索結果用。ArticleMetadataDtoに検索関連のスコア情報を追加。
 */
export const ArticleSearchResultDtoSchema = ArticleMetadataDtoSchema.extend({
    /** 検索一致度 / ベクトル類似度 (0.0 〜 1.0) 。主にベクトル検索で使用。 */
    matchScore: z.number().min(0).max(1).optional(),
    /** ヒットした箇所の抜粋。主に全文検索時のハイライト表示に使用。 */
    highlightedText: z.string().optional(),
});

export type ArticleSearchResultDto = z.infer<typeof ArticleSearchResultDtoSchema>;

/**
 * Paged Response
 * ページネーション対応の共通レスポンス
 */
export const PagedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
    z.object({
        items: z.array(itemSchema),
        totalCount: z.number().int().nonnegative(),
        hasNextPage: z.boolean(),
        nextCursor: z.string().optional(),
    });

export type PagedResponse<T> = {
    items: T[];
    totalCount: number;
    hasNextPage: boolean;
    nextCursor?: string;
};

/**
 * Article DTO (Detailed)
 * 記事の全情報（本文および全メタデータ）。記事詳細ページ等で使用される。
 * glossary: Article (Metadata + Content) に対応。
 * 
 * ArticleMetadataDto をベースとし、本文や構造化された詳細データを追加したもの。
 */
export const ArticleDtoSchema = ArticleMetadataDtoSchema.extend({
    /** 構造化された全メタデータ (ドメインエンティティの構造を維持) */
    metadata: ArticleMetadataSchema,
    /** 最終更新日時 */
    updatedAt: z.string(),
    /** ユーザーアクション関連の全メトリクス (ArticleMetadataDtoのengagementを全量版で上書き) */
    engagement: z.any(), // EngagementMetrics (can be refined to schema)
    /** 音源再生情報 */
    playback: PlaybackSchema.optional(),

    /** 参照元リンクの配列 */
    sourceAttributions: z.array(SourceAttributionSchema),
    /** 収益化要素の配列 */
    monetizationElements: z.array(MonetizationElementSchema),

    /** 記事の本文 (MDX形式)。ページ閲覧時に取得される。 */
    content: z.string(),
    /** 目次構造 (ContentStructure) */
    contentStructure: z.array(z.any()).optional(),

    /** 所属するシリーズ情報のスナップショット */
    seriesAssignments: z.array(z.object({
        seriesId: z.string(),
        seriesSlug: z.string(),
        seriesTitle: z.string(),
        order: z.number(),
    })).optional(),
});

export type ArticleDto = z.infer<typeof ArticleDtoSchema>;
