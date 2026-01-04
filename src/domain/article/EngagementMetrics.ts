/**
 * Engagement Metrics
 * 記事の「深さ」と「広がり」を測定する指標
 */
export interface EngagementMetrics {
    /**
     * viewCount (PageView)
     * 記事が発見された回数
     */
    readonly viewCount: number;

    /**
     * auditionCount (Audition)
     * 音源・譜例が再生された回数（音の体験）
     */
    readonly auditionCount: number;

    /**
     * likeCount (Like)
     * ユーザー（Maestro）からの能動的な評価
     */
    readonly likeCount: number;

    /**
     * resonanceCount (Resonance)
     * 感想・共有メモの投稿数（共鳴の数）
     */
    readonly resonanceCount: number;

    /**
     * shareCount
     * ソーシャルシェアの総計
     */
    readonly shareCount: number;

    /**
     * affiliateClickCount
     * 楽譜・CD等への送客数
     */
    readonly affiliateClickCount: number;

    /**
     * avgTimeOnPageSeconds
     * 平均滞在時間（Immersionの指標）
     */
    readonly avgTimeOnPageSeconds: number;
}

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
    avgTimeOnPageSeconds: 0,
};
