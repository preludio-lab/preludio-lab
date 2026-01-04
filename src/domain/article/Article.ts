import { ArticleMetadata, SourceAttribution, MonetizationElement } from './ArticleMetadata';
import { EngagementMetrics, INITIAL_ENGAGEMENT_METRICS } from './EngagementMetrics';
import { ArticleStatus, ArticleCategory } from './ArticleConstants';
import { AppLocale } from '../i18n/Locale';

/**
 * Content Structure (Table of Contents)
 * 記事の目次構造
 */
export type Section = {
    /** アンカーID (例: "introduction") */
    id: string;
    /** 目次の見出しテキスト */
    heading: string;
    /** 見出しレベル (2: h2, 3: h3) */
    level: number;
    /** 子セクション */
    children?: Section[];
};

/** 記事の目次構造 (Table of Contents) */
export type ContentStructure = Section[];

/** 
 * 記事の本文 (MDX形式の生テキスト)
 * ユビキタス言語: Content (実体) に対応
 */
export type ArticleContent = string;

/**
 * Series Assignment
 * シリーズへの所属情報
 */
export interface SeriesAssignment {
    /** シリーズID (UUID等) */
    seriesId: string;
    /** シリーズのスラグ (URL用) */
    seriesSlug: string;
    /** シリーズのタイトル (スナップショット) */
    seriesTitle: string;
    /** シリーズ内での表示順序 */
    order: number;
}

/**
 * Article Entity
 * 記事のドメインエンティティ (Aggreate Root)
 */
export class Article {
    /** 記事のユニークID */
    readonly id: string;
    /** URLスラグ (カテゴリ以下の相対パス) */
    readonly slug: string;
    /** 言語コード (AppLocale準拠) */
    readonly lang: AppLocale;
    /** 公開・管理状態 (Draft, Published等) */
    readonly status: ArticleStatus;
    /** 記事のカテゴリ (works, articles等) */
    readonly category: ArticleCategory;
    /** 正式な公開日時 */
    readonly publishedAt: Date | null;
    /** 作成日時 */
    readonly createdAt: Date;
    /** 最終更新日時 */
    readonly updatedAt: Date;

    /** 記事のメタデータ (作曲家、ジャンル、印象値等) */
    readonly metadata: ArticleMetadata;
    /** 記事の本文 (MDX形式) */
    readonly content: ArticleContent;
    /** 記事の目次構造 (TOC) */
    readonly contentStructure: ContentStructure;
    /** 記事のサムネイル画像URL */
    readonly thumbnail?: string;
    /** 推定読了時間 (秒) */
    readonly readingTimeSeconds: number;

    /** トップページ等で優先紹介される「おすすめ記事」フラグ */
    readonly isFeatured: boolean;
    /** 所属するシリーズ情報のリスト */
    readonly seriesAssignments: SeriesAssignment[];

    /** ユーザーの反応・没入度 (PageView等) */
    readonly engagementMetrics: EngagementMetrics;

    /** 記事の信頼性を担保する参照元リンク (Glossary: SourceAttribution) */
    readonly sourceAttributions: SourceAttribution[];
    /** 収益化要素のリスト (Glossary: MonetizationElement) */
    readonly monetizationElements: MonetizationElement[];

    constructor(props: {
        id: string;
        slug: string;
        lang: AppLocale;
        status: ArticleStatus;
        category: ArticleCategory;
        publishedAt?: Date | null;
        createdAt?: Date;
        updatedAt?: Date;
        metadata: ArticleMetadata;
        content: ArticleContent;
        contentStructure?: ContentStructure;
        thumbnail?: string;
        readingTimeSeconds?: number;
        isFeatured?: boolean;
        seriesAssignments?: SeriesAssignment[];
        engagementMetrics?: EngagementMetrics;
        sourceAttributions?: SourceAttribution[];
        monetizationElements?: MonetizationElement[];
    }) {
        this.id = props.id;
        this.slug = props.slug;
        this.lang = props.lang;
        this.status = props.status;
        this.category = props.category;
        this.publishedAt = props.publishedAt ?? null;
        this.createdAt = props.createdAt ?? new Date();
        this.updatedAt = props.updatedAt ?? new Date();
        this.metadata = props.metadata;
        this.content = props.content;
        this.contentStructure = props.contentStructure ?? [];
        this.thumbnail = props.thumbnail;
        this.readingTimeSeconds = props.readingTimeSeconds ?? 0;
        this.isFeatured = props.isFeatured ?? false;
        this.seriesAssignments = props.seriesAssignments ?? [];
        this.engagementMetrics = props.engagementMetrics ?? INITIAL_ENGAGEMENT_METRICS;
        this.sourceAttributions = props.sourceAttributions ?? [];
        this.monetizationElements = props.monetizationElements ?? [];
    }

    /**
     * 公開済みかどうかを判定
     */
    public isPublished(): boolean {
        return this.status === ArticleStatus.PUBLISHED;
    }

    /**
     * シリーズに所属しているか
     */
    public hasSeries(): boolean {
        return this.seriesAssignments.length > 0;
    }

    /**
     * Create a new instance with updated properties (Immutability)
     */
    public cloneWith(props: Partial<Omit<Article, 'cloneWith' | 'isPublished' | 'hasSeries'>>): Article {
        return new Article({
            id: props.id ?? this.id,
            slug: props.slug ?? this.slug,
            lang: props.lang ?? this.lang,
            status: props.status ?? this.status,
            category: props.category ?? this.category,
            publishedAt: props.publishedAt ?? this.publishedAt,
            createdAt: props.createdAt ?? this.createdAt,
            updatedAt: props.updatedAt ?? this.updatedAt,
            metadata: props.metadata ?? this.metadata,
            content: props.content ?? this.content,
            contentStructure: props.contentStructure ?? this.contentStructure,
            thumbnail: props.thumbnail ?? this.thumbnail,
            readingTimeSeconds: props.readingTimeSeconds ?? this.readingTimeSeconds,
            isFeatured: props.isFeatured ?? this.isFeatured,
            seriesAssignments: props.seriesAssignments ?? this.seriesAssignments,
            engagementMetrics: props.engagementMetrics ?? this.engagementMetrics,
            sourceAttributions: props.sourceAttributions ?? this.sourceAttributions,
            monetizationElements: props.monetizationElements ?? this.monetizationElements,
        });
    }
}
