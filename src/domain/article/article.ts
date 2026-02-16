import { ArticleMetadata } from './article.metadata';
import { ArticleStatus, ArticleControl, ArticleId, ArticleMasterId } from './article.control';
import { ArticleContent, ContentSection, ContentStructure } from './article.content';
import { ArticleEngagement, INITIAL_ENGAGEMENT_METRICS } from './article.engagement';
import { ArticleContext, SeriesAssignment, RelatedArticle } from './article.context';

export type { ContentSection, ContentStructure, SeriesAssignment, RelatedArticle };
export type { ArticleControl, ArticleEngagement, ArticleContext, ArticleId, ArticleMasterId };
export { ArticleContent };

/**
 * Article Summary Entity
 * 記事のサマリーエンティティ。一覧表示やメタデータのみが必要な用途で使用。
 * content を含まず、軽量。
 */
export class ArticleSummary {
  /** 制御情報 */
  readonly control: ArticleControl;
  /** 探索用メタデータ (作曲家、ジャンル、試聴情報等を含む) */
  readonly metadata: ArticleMetadata;
  /** エンゲージメント */
  readonly engagement: ArticleEngagement;
  /** 外部文脈 */
  readonly context: ArticleContext;

  constructor(props: {
    control: ArticleControl;
    metadata: ArticleMetadata;
    engagement?: ArticleEngagement;
    context?: ArticleContext;
  }) {
    this.control = props.control;
    this.metadata = props.metadata;
    this.engagement = props.engagement ?? { metrics: INITIAL_ENGAGEMENT_METRICS };
    this.context = props.context ?? {
      seriesAssignments: [],
      relatedArticles: [],
      sourceAttributions: [],
      monetizationElements: [],
    };
  }

  // --- Shortcuts for Convenience (Delegation) ---

  get id() {
    return this.control.id;
  }
  get masterId() {
    return this.control.masterId;
  }
  get lang() {
    return this.control.lang;
  }
  get status() {
    return this.control.status;
  }
  get slug() {
    return this.metadata.slug;
  }
  get category() {
    return this.metadata.category;
  }
  get title() {
    return this.metadata.title;
  }
  get publishedAt() {
    return this.metadata.publishedAt;
  }
  get isFeatured() {
    return this.metadata.isFeatured;
  }

  /**
   * 公開済みかどうかを判定
   */
  public isPublished(): boolean {
    return this.control.status === ArticleStatus.PUBLISHED;
  }

  /**
   * 現在時刻において、一般ユーザーに公開可能かを判定 (配信制御)
   * ステータスが「公開」かつ、公開予定日時を過ぎている場合に true となる。
   */
  public isPubliclyVisible(now: Date = new Date()): boolean {
    const isStatusPublished = this.isPublished();
    const hasReachedDate = this.metadata.publishedAt ? this.metadata.publishedAt <= now : false;

    return isStatusPublished && hasReachedDate;
  }
}

/**
 * Article Entity
 * 記事のドメインエンティティ (Aggregate Root / Coordinator)
 * ArticleSummary を拡張し、本文 (Content) を追加したもの。
 * 各モジュール（Control, Metadata, Content, Engagement, Context）を束ね、整合性を管理する。
 */
export class Article extends ArticleSummary {
  /** コンテンツ実体 */
  readonly content: ArticleContent;

  constructor(props: {
    control: ArticleControl;
    metadata: ArticleMetadata;
    content: ArticleContent;
    engagement?: ArticleEngagement;
    context?: ArticleContext;
  }) {
    super({
      control: props.control,
      metadata: props.metadata,
      engagement: props.engagement,
      context: props.context,
    });
    this.content = props.content;
  }

  /**
   * シリーズに所属しているか
   */
  public hasSeries(): boolean {
    return this.context.seriesAssignments.length > 0;
  }

  /**
   * 記事エンティティの複製 (イミュータブルな更新)
   */
  public cloneWith(props: {
    control?: Partial<ArticleControl>;
    metadata?: Partial<ArticleMetadata>;
    content?: Partial<ArticleContent>;
    engagement?: Partial<ArticleEngagement>;
    context?: Partial<ArticleContext>;
  }): Article {
    return new Article({
      control: props.control ? { ...this.control, ...props.control } : this.control,
      metadata: props.metadata ? { ...this.metadata, ...props.metadata } : this.metadata,
      content: props.content ? { ...this.content, ...props.content } : this.content,
      engagement: props.engagement ? { ...this.engagement, ...props.engagement } : this.engagement,
      context: props.context ? { ...this.context, ...props.context } : this.context,
    });
  }
}
