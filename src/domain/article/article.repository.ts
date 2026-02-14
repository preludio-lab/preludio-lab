import { Article, ArticleSummary } from './article';
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
   * スラグを指定して記事（フル）を取得します
   */
  findBySlug(lang: string, category: ArticleCategory, slug: string): Promise<Article | null>;

  /**
   * IDを指定して記事（フル）を取得します
   */
  findById(id: string, lang: string): Promise<Article | null>;

  /**
   * スラグを指定して記事サマリーを取得します
   */
  findSummaryBySlug(
    lang: string,
    category: ArticleCategory,
    slug: string,
  ): Promise<ArticleSummary | null>;

  /**
   * IDを指定して記事サマリーを取得します
   */
  findSummaryById(id: string, lang: string): Promise<ArticleSummary | null>;

  /**
   * 条件に基づいて記事の一覧（サマリー）を検索します
   */
  search(criteria: ArticleSearchCriteria): Promise<PagedResponse<ArticleSummary>>;

  /**
   * 記事を保存します
   */
  save(article: Article): Promise<void>;

  /**
   * 特定の言語版の記事を削除します
   */
  deleteById(id: string, lang: string): Promise<void>;

  /**
   * 記事そのもの（全言語版を含む）を完全に削除します
   */
  deleteMaster(id: string): Promise<void>;
}
