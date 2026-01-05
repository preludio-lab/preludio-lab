import { ArticleCategory } from './ArticleConstants';
import { SourceAttribution, MonetizationElement } from './ArticleMetadata';

/**
 * Series Assignment
 * シリーズへの所属情報
 */
export type SeriesAssignment = {
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
 * Related Article
 * 記事の文脈に基づいた関連記事の参照。
 * glossary: RelatedArticle に対応
 */
export type RelatedArticle = {
    /** ターゲット記事のID */
    readonly articleId: string;
    /** 表示用のタイトル (スナップショット) */
    readonly title: string;
    /** 記事カテゴリ */
    readonly category: ArticleCategory;
    /** URLスラグ */
    readonly slug: string;
}

/**
 * Article Context
 * 記事の外部世界（根拠・ビジネス・繋がり）との関係定義。
 * glossary: ArticleContext に対応
 */
export type ArticleContext = {
    /** 所属するシリーズ情報のリスト */
    readonly seriesAssignments: SeriesAssignment[];
    /** 静的にリンクされた関連記事のリスト */
    readonly relatedArticles: RelatedArticle[];
    /** 記事の信頼性を担保する参照元リンク */
    readonly sourceAttributions: SourceAttribution[];
    /** 収益化要素のリスト */
    readonly monetizationElements: MonetizationElement[];
};
