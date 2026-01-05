import { EngagementMetrics, INITIAL_ENGAGEMENT_METRICS } from './EngagementMetrics';

/**
 * Article Engagement
 * ユーザーの反応に関する統計データ。
 * glossary: ArticleEngagement に対応
 */
export type ArticleEngagement = {
    /** ユーザーの反応・没入度メトリクス */
    readonly metrics: EngagementMetrics;
};

export { INITIAL_ENGAGEMENT_METRICS };
