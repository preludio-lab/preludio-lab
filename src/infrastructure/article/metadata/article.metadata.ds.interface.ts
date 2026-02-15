import { ArticleCategory } from '@/domain/article/article.metadata';
import { ArticleStatus, ArticleMasterId } from '@/domain/article/article.control';
import { ArticleSearchCriteria } from '@/domain/article/article.repository';

export interface ArticleRow {
  id: string; // Master UUID
  workId: string | null;
  slug: string;
  category: ArticleCategory;
  isFeatured: boolean;
  readingTimeSeconds: number;
  thumbnailPath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TranslationRow {
  id: string; // Translation UUID
  articleId: string; // Master UUID
  lang: string;
  status: ArticleStatus;
  title: string;
  displayTitle: string;
  catchcopy: string | null;
  excerpt: string | null;
  publishedAt: string | null;
  isFeatured: boolean;
  mdxPath?: string | null;
  slSlug: string;
  slCategory: ArticleCategory;
  slComposerName: string | null;
  slWorkCatalogueId: string | null;
  slWorkNicknames: string[] | null;
  slGenre: string[] | null;
  slInstrumentations: string[] | null;
  slEra: string | null;
  slNationality: string | null;
  slKey: string | null;
  slPerformanceDifficulty: number | null;
  slImpressionDimensions: unknown;
  slSeriesAssignments: unknown;
  metadata: unknown;
  contentStructure: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface ArticleMetadataRow {
  articles: ArticleRow;
  article_translations: TranslationRow;
}

export interface IArticleMetadataDataSource {
  /**
   * IDと言語コードを指定して記事のメタデータを取得します。
   */
  findById(id: ArticleMasterId, lang: string): Promise<ArticleMetadataRow | undefined>;

  /**
   * スラッグと言語コードを指定して記事のメタデータを取得します。
   */
  findBySlug(
    slug: string,
    lang: string,
    category?: ArticleCategory,
  ): Promise<ArticleMetadataRow | undefined>;

  /**
   * 指定された検索条件に基づいて記事メタデータの一覧を取得します。
   */
  findMany(criteria: ArticleSearchCriteria): Promise<{
    rows: ArticleMetadataRow[];
    totalCount: number;
  }>;

  /**
   * メタデータを保存します。
   */
  save(row: ArticleMetadataRow): Promise<void>;

  /**
   * 特定の言語の翻訳レコードを削除します。
   */
  deleteTranslation(id: ArticleMasterId, lang: string): Promise<void>;

  /**
   * 指定された ID に紐づく翻訳レコードの総数を取得します。
   */
  countTranslations(id: ArticleMasterId): Promise<number>;

  /**
   * 指定された ID に紐づく全ての翻訳メタデータを取得します（全言語）。
   */
  findAllTranslations(id: ArticleMasterId): Promise<ArticleMetadataRow[]>;

  deleteAll(id: ArticleMasterId): Promise<void>;
}
