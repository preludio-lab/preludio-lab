import { z } from 'zod';
import { zInt } from '@/shared/validation/zod';

/**
 * Engagement Metrics
 * 記事の「深さ」と「広がり」を測定する指標
 */
export const EngagementMetricsSchema = z.object({
    /** 
     * 累計閲覧数 (PageView)
     */
    viewCount: zInt().nonnegative().max(1000000000).default(0),
    auditionCount: zInt().nonnegative().max(1000000000).default(0),
    likeCount: zInt().nonnegative().max(10000000).default(0),
    resonanceCount: zInt().nonnegative().max(1000).default(0),
    shareCount: zInt().nonnegative().max(10000000).default(0),
    affiliateClickCount: zInt().nonnegative().max(100000).default(0),
    conversionCount: zInt().nonnegative().max(100000).default(0),
    totalRevenue: zInt().nonnegative().max(10000000).default(0),
    totalTimeOnPageSeconds: zInt().nonnegative().max(1000000000).default(0),
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
