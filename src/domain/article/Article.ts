import { ArticleMetadata } from './ArticleMetadata';
import { EngagementMetrics, INITIAL_ENGAGEMENT_METRICS } from './EngagementMetrics';
import { ArticleStatus, ArticleCategory } from './ArticleConstants';

/**
 * Content Structure (Table of Contents)
 * 記事の目次構造
 */
export type Section = {
    id: string;      // Anchor ID (e.g. "introduction")
    heading: string; // Human readable text
    level: number;   // 2 (h2) or 3 (h3)
    children?: Section[];
};

export type ContentStructure = Section[];

/**
 * Series Assignment
 * シリーズへの所属情報
 */
export interface SeriesAssignment {
    seriesId: string;
    seriesSlug: string;
    seriesTitle: string; // Snapshot
    order: number;
}

/**
 * Article Entity
 * 記事のドメインエンティティ (Aggreate Root)
 */
export class Article {
    readonly id: string;
    readonly slug: string;
    readonly lang: string;
    readonly status: ArticleStatus;
    readonly category: ArticleCategory;
    readonly publishedAt: Date | null;
    readonly createdAt: Date;
    readonly updatedAt: Date;

    // Metadata & Content
    readonly metadata: ArticleMetadata;
    readonly content: string; // MDX Body
    readonly contentStructure: ContentStructure;
    readonly thumbnail?: string;
    readonly readingTimeSeconds: number;

    // Domain Logic Attributes
    readonly isFeatured: boolean;
    readonly seriesAssignments: SeriesAssignment[];

    // Engagement
    readonly engagementMetrics: EngagementMetrics;

    constructor(props: {
        id: string;
        slug: string;
        lang: string;
        status: ArticleStatus;
        category: ArticleCategory;
        publishedAt?: Date | null;
        createdAt?: Date;
        updatedAt?: Date;
        metadata: ArticleMetadata;
        content: string;
        contentStructure?: ContentStructure;
        thumbnail?: string;
        readingTimeSeconds?: number;
        isFeatured?: boolean;
        seriesAssignments?: SeriesAssignment[];
        engagementMetrics?: EngagementMetrics;
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
        });
    }
}
