/**
 * Article Status
 * 記事の公開状態
 */
export const ArticleStatus = {
    /** 公開済み */
    PUBLISHED: 'published',
    /** 下書き (管理画面のみ) */
    DRAFT: 'draft',
    /** 非公開 (URLを知っている人のみ) */
    PRIVATE: 'private',
    /** アーカイブ済み (一覧に非表示) */
    ARCHIVED: 'archived',
} as const;

export type ArticleStatus = (typeof ArticleStatus)[keyof typeof ArticleStatus];

/**
 * Article Category
 * コンテンツの分類
 */
export const ArticleCategory = {
    /** 楽曲紹介 (メイン) */
    WORKS: 'works',
    /** 作曲家解説 */
    COMPOSERS: 'composers',
    /** 時代区分 */
    ERAS: 'eras',
    /** ジャンル解説 */
    GENRES: 'genres',
    /** 音楽用語・概念 */
    TERMINOLOGY: 'terminology',
    /** 楽器解説 */
    INSTRUMENTS: 'instruments',
    /** 演奏家・団体 */
    PERFORMERS: 'performers',
    /** 音楽理論・分析 */
    THEORY: 'theory',
    /** 読み物・コラム */
    COLUMNS: 'columns',
    /** 特設シリーズ・特集 */
    SERIES: 'series',
    /** オリジナル楽曲・企画 */
    ORIGINALS: 'originals',
} as const;

export type ArticleCategory =
    (typeof ArticleCategory)[keyof typeof ArticleCategory];

/**
 * Monetization Type
 * 収益化要素の種別
 */
export const MonetizationType = {
    /** アフィリエイトリンク (楽譜、CD等) */
    AFFILIATE: 'affiliate',
    /** 自社ショップ商品 */
    SHOP: 'shop',
    /** その他 (ドネーション等) */
    OTHER: 'other',
} as const;

export type MonetizationType = (typeof MonetizationType)[keyof typeof MonetizationType];

/**
 * Sort Direction
 * ソートの昇順・降順
 */
export const SortDirection = {
    /** 昇順 (小さい順、A-Z、古い順) */
    ASC: 'asc',
    /** 降順 (大きい順、Z-A、新しい順) */
    DESC: 'desc',
} as const;

export type SortDirection = (typeof SortDirection)[keyof typeof SortDirection];

/**
 * Article Sort Option (Sort Keys)
 * 検索・一覧表示のソート軸
 */
export const ArticleSortOption = {
    /** 公開日時順 */
    PUBLISHED_AT: 'publishedAt',
    /** 専門性レベル順 */
    READING_LEVEL: 'readingLevel',
    /** 演奏難易度順 */
    PERFORMANCE_DIFFICULTY: 'performanceDifficulty',
    /** 作品の通俗性・人気順 */
    WORK_POPULARITY: 'workPopularity',
    /** トレンド・注目順 (Immersion等に基づく) */
    TRENDING: 'trending',
    /** 作曲年順 */
    COMPOSITION_YEAR: 'compositionYear',
    /** 作曲者の誕生年順 */
    COMPOSER_BIRTH_YEAR: 'composerBirthYear',
    /** タイトル順 */
    TITLE: 'title',
} as const;

export type ArticleSortOption =
    (typeof ArticleSortOption)[keyof typeof ArticleSortOption];
