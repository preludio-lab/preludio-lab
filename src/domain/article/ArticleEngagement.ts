import { z } from 'zod';

/**
 * Engagement Metrics
 * 記事の「深さ」と「広がり」を測定する指標
 */
export const EngagementMetricsSchema = z.object({
    /** 
     * 累計閲覧数 (PageView)
     */
    viewCount: z.number().int().nonnegative().default(0),

    /** 
     * 累計再生数 (Audition)
     */
    auditionCount: z.number().int().nonnegative().default(0),

    /** 
     * お気に入り数 (Like)
     */
    likeCount: z.number().int().nonnegative().default(0),

    /** 
     * 共鳴数 (Resonance)
     */
    resonanceCount: z.number().int().nonnegative().default(0),

    /** 
     * シェア数 (SocialShare)
     */
    shareCount: z.number().int().nonnegative().default(0),

    /** 
     * アフィリエイトクリック数 (AffiliateClick)
     */
    affiliateClickCount: z.number().int().nonnegative().default(0),

    /**
     * コンバージョン数 (Conversion)
     * 成果地点（購入・契約等）に到達した数。
     */
    conversionCount: z.number().int().nonnegative().default(0),

    /**
     * 合計収益 (TotalRevenue)
     * 記事から発生した推定収益額（最小通貨単位、例: JPY）。
     */
    totalRevenue: z.number().int().nonnegative().default(0),

    /** 
     * 合計滞在時間 (TotalTimeOnPage)
     * 精度を維持するため累積値を保持。平均は DTO 等で算出。
     */
    totalTimeOnPageSeconds: z.number().int().nonnegative().default(0),
});

export type EngagementMetrics = z.infer<typeof EngagementMetricsSchema>;

/**
 * Article Engagement
 * ユーザーの反応に関する統計データ。
 * glossary: ArticleEngagement に対応
 */
export const ArticleEngagementSchema = z.object({
    /** ユーザーの反応・没入度メトリクス */
    metrics: EngagementMetricsSchema,
});

export type ArticleEngagement = z.infer<typeof ArticleEngagementSchema>;

/**
 * Default Engagement Metrics
 * 初期状態
 */
export const INITIAL_ENGAGEMENT_METRICS: EngagementMetrics = {
    viewCount: 0,
    auditionCount: 0,
    likeCount: 0,
    resonanceCount: 0,
    shareCount: 0,
    affiliateClickCount: 0,
    conversionCount: 0,
    totalRevenue: 0,
    totalTimeOnPageSeconds: 0,
};
