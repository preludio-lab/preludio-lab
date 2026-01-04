/**
 * Article Status
 * 記事の公開状態
 */
export const ArticleStatus = {
    PUBLISHED: 'published',
    DRAFT: 'draft',
    PRIVATE: 'private',
    ARCHIVED: 'archived',
} as const;

export type ArticleStatus = (typeof ArticleStatus)[keyof typeof ArticleStatus];

/**
 * Article Category
 * コンテンツの分類
 */
export const ArticleCategory = {
    WORKS: 'works',
    COMPOSERS: 'composers',
    ERAS: 'eras',
    GENRES: 'genres',
    TERMINOLOGY: 'terminology',
    INSTRUMENTS: 'instruments',
    PERFORMERS: 'performers',
    THEORY: 'theory',
    COLUMNS: 'columns',
    SERIES: 'series',
    ORIGINALS: 'originals',
} as const;

export type ArticleCategory =
    (typeof ArticleCategory)[keyof typeof ArticleCategory];

/**
 * Sort Direction
 */
export const SortDirection = {
    ASC: 'asc',
    DESC: 'desc',
} as const;

export type SortDirection = (typeof SortDirection)[keyof typeof SortDirection];

/**
 * Article Sort Option (Sort Keys)
 * 検索・一覧表示のソート軸
 */
export const ArticleSortOption = {
    PUBLISHED_AT: 'publishedAt',
    READING_LEVEL: 'readingLevel',
    PERFORMANCE_DIFFICULTY: 'performanceDifficulty',
    WORK_POPULARITY: 'workPopularity',
    TRENDING: 'trending',
    COMPOSITION_YEAR: 'compositionYear',
    COMPOSER_BIRTH_YEAR: 'composerBirthYear',
    ALPHABETICAL: 'alphabetical',
} as const;

export type ArticleSortOption =
    (typeof ArticleSortOption)[keyof typeof ArticleSortOption];
