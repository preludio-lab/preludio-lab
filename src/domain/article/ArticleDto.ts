import { ArticleMetadata } from './ArticleMetadata';
import { EngagementMetrics } from './EngagementMetrics';
import { ArticleStatus, ArticleCategory } from './ArticleConstants';

/**
 * Article DTO (Summary)
 * 一覧表示用など、本文（content）を含まない軽量モデル
 */
export interface ArticleSummaryDto {
    id: string;
    slug: string;
    lang: string;
    status: ArticleStatus;
    category: ArticleCategory;
    isFeatured: boolean;
    publishedAt: string | null;
    thumbnail?: string;

    // Flattened Metadata for easier UI consumption
    title: string;
    displayTitle: string;
    composerName?: string;
    workTitle?: string;
    excerpt?: string;

    // Metrics
    viewCount: number;
}

/**
 * Article Search Result DTO
 * 検索結果用（スコアなどを含む）
 */
export interface ArticleSearchResultDto extends ArticleSummaryDto {
    matchScore?: number; // 検索一致度 / ベクトル類似度
    highlightedText?: string; // ヒットした箇所の抜粋
}

/**
 * Paged Response
 * ページネーション対応の共通レスポンス
 */
export interface PagedResponse<T> {
    items: T[];
    totalCount: number;
    hasNextPage: boolean;
    nextCursor?: string; // カーソルベースの場合
}

/**
 * Article Detail DTO
 * 詳細表示用（本文や全メタデータを含む）
 */
export interface ArticleDetailDto {
    id: string;
    slug: string;
    lang: string;
    status: ArticleStatus;
    category: ArticleCategory;
    isFeatured: boolean;
    publishedAt: string | null;
    updatedAt: string;
    thumbnail?: string;

    // Full Metadata
    metadata: ArticleMetadata;
    engagement: EngagementMetrics;

    // Content
    content: string; // MDX Body
    contentStructure?: any; // 目次構造 (ContentStructure型を後で定義予定)

    // Series Info
    seriesAssignments?: {
        seriesId: string;
        seriesSlug: string;
        seriesTitle: string;
        order: number;
    }[];
}
