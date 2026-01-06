import { z } from 'zod';
import { ArticleControlSchema } from './ArticleControl';
import { ArticleMetadataSchema, PlaybackSchema, ArticleCategory } from './ArticleMetadata';
import { ArticleContentSchema } from './ArticleContent';
import { ArticleContextSchema } from './ArticleContext';
import { EngagementMetricsSchema } from './ArticleEngagement';

/**
 * Article Metadata DTO (List view)
 * 一覧表示や検索結果、ヒーローセクションなどで使用される軽量モデル。
 * 利便性のため、基本的な識別情報と主要なメタデータをフラットに保持します。
 */
export const ArticleMetadataDtoSchema = z.object({
    // Control Info (flattened for convenience)
    id: z.string(),
    slug: z.string(),
    lang: z.string(),
    status: z.string(), // ArticleStatus

    // Core Metadata (flattened for convenience)
    title: z.string(),
    displayTitle: z.string(),
    category: z.nativeEnum(ArticleCategory),
    isFeatured: z.boolean().optional(),
    publishedAt: z.string().nullable(),
    thumbnail: z.string().optional(),

    // Musical Context
    composerName: z.string().optional(),
    workTitle: z.string().optional(),

    // Indicators
    excerpt: z.string().optional(),
    readingTimeSeconds: z.number().int().nonnegative(),
    playback: PlaybackSchema.optional(),

    // Engagement Summary (Optional in list view)
    viewCount: z.number().int().nonnegative().optional(),
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
 * ドメインモデルの各モジュールを包含する集約構造を持ちます。
 */
export const ArticleDtoSchema = z.object({
    /** システム管理情報 (ID, 状態, 作成・更新日) */
    control: ArticleControlSchema,
    /** 音楽的・静的属性 (タイトル, 作曲家, ジャンル等) */
    metadata: ArticleMetadataSchema,
    /** コンテンツ実体 (本文 MDX, 目次構造) */
    content: ArticleContentSchema,
    /** 外部・ビジネス文脈 (参考文献, 収益化要素, 関連記事) */
    context: ArticleContextSchema,
    /** 動的メトリクス (PV, 再生数, いいね等) */
    engagement: EngagementMetricsSchema,
});

export type ArticleDto = z.infer<typeof ArticleDtoSchema>;

