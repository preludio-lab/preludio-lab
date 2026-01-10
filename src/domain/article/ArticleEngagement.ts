import { z, zInt } from '@/shared/validation/zod';

// バリデーション用定数
// 数値区切り文字 (_) を使用して桁数を分かりやすくしています。
const MAX_TOTAL_VIEWS = 1_000_000_000; // 10億
const MAX_TOTAL_AUDITIONS = 1_000_000_000; // 10億
const MAX_TOTAL_LIKES = 10_000_000; // 1,000万
const MAX_TOTAL_RESONANCES = 1_000; // 1,000
const MAX_TOTAL_SHARES = 10_000_000; // 1,000万
const MAX_TOTAL_TIME_SECONDS = 1_000_000_000; // 10億秒 (~31年)

/**
 * Engagement Metrics
 * 記事の「深さ」と「広がり」を測定する指標
 */
export const EngagementMetricsSchema = z.object({
  /**
   * 累計閲覧数 (PageView)
   */
  viewCount: zInt().nonnegative().max(MAX_TOTAL_VIEWS).default(0),

  /**
   * 累計再生数 (Audition)
   */
  auditionCount: zInt().nonnegative().max(MAX_TOTAL_AUDITIONS).default(0),

  /**
   * お気に入り数 (Like)
   */
  likeCount: zInt().nonnegative().max(MAX_TOTAL_LIKES).default(0),

  /**
   * 共鳴数 (Resonance)
   */
  resonanceCount: zInt().nonnegative().max(MAX_TOTAL_RESONANCES).default(0),

  /**
   * シェア数 (SocialShare)
   */
  shareCount: zInt().nonnegative().max(MAX_TOTAL_SHARES).default(0),

  /**
   * 合計滞在時間 (TotalTimeOnPage)
   * 精度を維持するため累積値を保持。平均は DTO 等で算出。
   */
  totalTimeOnPageSeconds: zInt().nonnegative().max(MAX_TOTAL_TIME_SECONDS).default(0),
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
  totalTimeOnPageSeconds: 0,
};
