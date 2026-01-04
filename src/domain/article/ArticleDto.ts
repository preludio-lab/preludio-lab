import { ArticleMetadata } from './ArticleMetadata';
import { ArticleContent } from './Article';
import { EngagementMetrics } from './EngagementMetrics';
import { ArticleStatus, ArticleCategory } from './ArticleConstants';
import { AppLocale } from '../i18n/Locale';

/**
 * Article DTO (Summary)
 * 一覧表示用など、本文（content）を含まない軽量モデル
 */
export interface ArticleSummaryDto {
    /** 記事のユニークID */
    id: string;
    /** URLスラグ */
    slug: string;
    /** 言語コード */
    lang: AppLocale;
    /** 公開・管理状態 */
    status: ArticleStatus;
    /** 記事カテゴリ */
    category: ArticleCategory;
    /** 「おすすめ記事」フラグ */
    isFeatured: boolean;
    /** 公開日時 (ISO8601等) */
    publishedAt: string | null;
    /** サムネイルURL */
    thumbnail?: string;

    // Flattened Metadata for easier UI consumption
    /** UI表示タイトル */
    title: string;
    /** 正式な表示用タイトル */
    displayTitle: string;
    /** 作曲家名 */
    composerName?: string;
    /** 作品タイトル */
    workTitle?: string;
    /** 抜粋・概要文 */
    excerpt?: string;

    // Metrics
    /** 累積閲覧数 */
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
    /** 記事のユニークID */
    id: string;
    /** URLスラグ */
    slug: string;
    /** 言語コード */
    lang: AppLocale;
    /** 公開・管理状態 */
    status: ArticleStatus;
    /** 記事カテゴリ */
    category: ArticleCategory;
    /** 「おすすめ記事」フラグ */
    isFeatured: boolean;
    /** 公開日時 */
    publishedAt: string | null;
    /** 最終更新日時 */
    updatedAt: string;
    /** サムネイルURL */
    thumbnail?: string;

    /** 構造化された全メタデータ */
    metadata: ArticleMetadata;
    /** ユーザーアクション関連のメトリクス */
    engagement: EngagementMetrics;

    /** 記事の本文 (MDX形式) */
    content: ArticleContent;
    /** 目次構造 (ContentStructure) */
    contentStructure?: any;

    /** 所属するシリーズ情報のスナップショット */
    seriesAssignments?: {
        seriesId: string;
        seriesSlug: string;
        seriesTitle: string;
        order: number;
    }[];
}
