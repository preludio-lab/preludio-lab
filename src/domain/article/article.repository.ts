import { Article } from './article';
import { ArticleStatus } from './article.control';
import { ArticleCategory } from './article.metadata';
import { ArticleSortOption, SortDirection } from './article.constants';
import { PagedResponse } from '../shared/pagination';

/**
 * Keyword Search Scope
 * キーワード検索の対象範囲
 */
export const ArticleKeywordScope = {
  TITLE: 'title',
  SUMMARY: 'summary',
  ALL: 'all',
} as const;

export type ArticleKeywordScope = (typeof ArticleKeywordScope)[keyof typeof ArticleKeywordScope];

/**
 * Article Filter Options
 * 記事の絞り込み条件
 */
export interface ArticleFilterOptions {
  lang: string;
  status?: ArticleStatus[];
  category?: ArticleCategory;
  tags?: string[];
  keyword?: string;
  keywordScope?: ArticleKeywordScope;
  seriesId?: string;
  isFeatured?: boolean;

  // Metadata Filters
  composerId?: string;
  minReadingLevel?: number;
  maxReadingLevel?: number;
  minDifficulty?: number; // Performance Difficulty
  maxDifficulty?: number;
}

/**
 * Article Sort Criteria
 * 記事のソート条件
 */
export interface ArticleSortCriteria {
  field: ArticleSortOption;
  direction: SortDirection;
}

/**
 * Article Search Criteria
 * 統合された検索条件オブジェクト
 */
export interface ArticleSearchCriteria {
  filter: ArticleFilterOptions;
  sort?: ArticleSortCriteria;
  pagination: {
    limit: number;
    offset: number;
  };
}

/**
 * ArticleRepository
 * 記事リポジトリのインターフェース
 */
export interface ArticleRepository {
  /**
   * Find a single article by Slug
   */
  findBySlug(lang: string, category: ArticleCategory, slug: string): Promise<Article | null>;

  /**
   * Find a single article by ID
   */
  findById(id: string, lang: string): Promise<Article | null>;

  /**
   * Find articles matching criteria
   */
  findMany(criteria: ArticleSearchCriteria): Promise<PagedResponse<Article>>;

  /**
   * Management Methods (CUD)
   */
  save(article: Article): Promise<void>;
  delete(id: string): Promise<void>;
}
