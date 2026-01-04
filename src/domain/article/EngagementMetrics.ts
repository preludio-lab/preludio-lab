/**
 * Engagement Metrics
 * 記事の「深さ」と「広がり」を測定する指標
 */
export interface EngagementMetrics {
    /** 
     * 累計閲覧数 (PageView)
     * 楽曲が発見・表示された回数
     */
    readonly viewCount: number;

    /** 
     * 累計再生数 (Audition)
     * 音源や譜例が再生された回数。ユーザーの強い関心を示すシグナル。
     */
    readonly auditionCount: number;

    /** 
     * お気に入り数 (Like)
     * Maestro（会員）による能動的な高評価。
     */
    readonly likeCount: number;

    /** 
     * 共鳴数 (Resonance)
     * 楽曲に対する感想やメモの投稿数。
     */
    readonly resonanceCount: number;

    /** 
     * シェア数 (SocialShare)
     * SNS等への拡散アクション。
     */
    readonly shareCount: number;

    /** 
     * アフィリエイトクリック数 (AffiliateClick)
     * 楽譜サイトや配信プラットフォームへの送客数。
     */
    readonly affiliateClickCount: number;

    /** 
     * 平均滞在時間 (TimeOnPage)
     * 没入度 (Immersion) を算出するための基礎データ。
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
