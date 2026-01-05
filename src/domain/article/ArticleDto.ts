import { ArticleMetadata, SourceAttribution, MonetizationElement, Playback } from './ArticleMetadata';
import { ArticleContent, ContentStructure } from './Article';
import { EngagementMetrics } from './EngagementMetrics';
import { ArticleStatus, ArticleCategory } from './ArticleConstants';
import { AppLocale } from '../i18n/Locale';

/**
 * Article Metadata DTO
 * 記事の構造化データ（Metadata）。一覧表示や検索結果、ヒーローセクションなどで使用される軽量モデル。
 * glossary: Article Metadata に対応。
 */
export interface ArticleMetadataDto {
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
    isFeatured?: boolean;
    /** 公開日時 (ISO8601等) */
    publishedAt: string | null;
    /** サムネイルのURLまたはパス */
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

    // UX Indicators
    /** 推定読了時間 (秒) */
    readingTimeSeconds: number;
    /** ユーザー向けのソーシャルプルーフ指標 */
    engagement: ArticleEngagementDto;
}

/**
 * Article Engagement DTO
 * 一覧表示等でソーシャルプルーフとして表示される指標群
 */
export interface ArticleEngagementDto {
    /** 累計閲覧数 */
    viewCount: number;
    /** 累計お気に入り数 */
    likeCount: number;
}

/**
 * Article Search Result DTO
 * 検索結果用。ArticleMetadataDtoに検索関連のスコア情報を追加。
 */
export interface ArticleSearchResultDto extends ArticleMetadataDto {
    /** 検索一致度 / ベクトル類似度 (0.0 〜 1.0) 。主にベクトル検索で使用。 */
    matchScore?: number;
    /** ヒットした箇所の抜粋。主に全文検索時のハイライト表示に使用。 */
    highlightedText?: string;
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
 * Article DTO (Detailed)
 * 記事の全情報（本文および全メタデータ）。記事詳細ページ等で使用される。
 * glossary: Article (Metadata + Content) に対応。
 */
export interface ArticleDto {
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
    isFeatured?: boolean;
    /** 公開日時 */
    publishedAt: string | null;
    /** 最終更新日時 */
    updatedAt: string;
    /** サムネイルのURLまたはパス */
    thumbnail?: string;

    /** 構造化された全メタデータ */
    metadata: ArticleMetadata;
    /** ユーザーアクション関連のメトリクス (閲覧数・没入度等) */
    engagement: EngagementMetrics;
    /** 音源再生情報 */
    playback?: Playback;

    /** 参照元リンクの配列 */
    sourceAttributions: SourceAttribution[];
    /** 収益化要素の配列 */
    monetizationElements: MonetizationElement[];

    /** 記事の本文 (MDX形式)。ページ閲覧時に取得される。 */
    content: ArticleContent;
    /** 目次構造 (ContentStructure) */
    contentStructure?: ContentStructure;

    /** 所属するシリーズ情報のスナップショット */
    seriesAssignments?: {
        seriesId: string;
        seriesSlug: string;
        seriesTitle: string;
        order: number;
    }[];
}
