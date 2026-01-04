import { Article } from './Article';
import { ArticleCategory, ArticleSortOption, SortDirection, ArticleStatus } from './ArticleConstants';
import { PagedResponse } from './ArticleDto';

/**
 * Article Search Criteria
 * 検索条件オブジェクト
 */
export interface ArticleSearchCriteria {
    lang: string;
    status?: ArticleStatus[];
    category?: ArticleCategory;
    tags?: string[];
    seriesId?: string;
    isFeatured?: boolean;

    // Metadata Filters
    composerId?: string;
    minReadingLevel?: number;
    maxReadingLevel?: number;
    minDifficulty?: number; // Performance Difficulty
    maxDifficulty?: number;

    // Pagination & Sort
    limit?: number;
    offset?: number; // Cursor-based pagination might be defined separately if needed
    sortBy?: ArticleSortOption;
    sortDirection?: SortDirection;
}

/**
 * IArticleRepository
 * 記事リポジトリのインターフェース
 */
export interface IArticleRepository {
    /**
     * Find a single article by Slug
     */
    findBySlug(lang: string, slug: string): Promise<Article | null>;

    /**
     * Find a single article by ID
     */
    findById(id: string): Promise<Article | null>;

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
