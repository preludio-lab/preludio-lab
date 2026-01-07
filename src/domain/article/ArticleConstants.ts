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
