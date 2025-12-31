/**
 * Content Categories (Domain Value Object)
 */
export const ContentCategory = {
  WORKS: 'works', // 楽曲紹介
  COMPOSERS: 'composers', // 作曲家
  THEORY: 'theory', // 音楽理論
  ERAS: 'eras', // 時代様式
  INSTRUMENTS: 'instruments', // 楽器
  PERFORMERS: 'performers', // 演奏家
  TERMINOLOGY: 'terminology', // 用語集
  COLUMNS: 'columns', // コラム
} as const;

export type ContentCategory = (typeof ContentCategory)[keyof typeof ContentCategory];

// アプリケーションでサポートされる全カテゴリ
export const SUPPORTED_CATEGORIES = Object.values(ContentCategory);

/**
 * Content Sort Options
 */
export const ContentSortOption = {
  LATEST: 'latest',
  OLDEST: 'oldest',
  TITLE: 'title',
  DIFFICULTY_ASC: 'difficulty_asc',
  DIFFICULTY_DESC: 'difficulty_desc',
  POPULAR: 'popular', // 人気順 (将来用)
  TRENDING: 'trending', // 注目順 (将来用)
} as const;

export type ContentSortOption = (typeof ContentSortOption)[keyof typeof ContentSortOption];
