import { eq, and, desc, asc, inArray, like, or, sql, AnyColumn } from 'drizzle-orm';
import { db } from '../database/turso.client';
import { articles, articleTranslations } from '../database/schema';
import { ArticleCategory } from '@/domain/article/article.metadata';
import { ArticleStatus } from '@/domain/article/article.control';
import { ArticleSearchCriteria, ArticleKeywordScope } from '@/domain/article/article.repository';
import { ArticleSortOption, SortDirection } from '@/domain/article/article.constants';
import { Logger } from '@/shared/logging/logger';
import { AppError } from '@/domain/shared/app-error';

import {
  IArticleMetadataDataSource,
  MetadataRow,
} from './interfaces/article.metadata.ds.interface';

export class TursoArticleMetadataDataSource implements IArticleMetadataDataSource {
  constructor(private readonly logger: Logger) {}
  /**
   * IDと言語コードを指定して記事のメタデータを取得します。
   * 公開ステータスに関わらず、指定されたIDの記事が存在すれば返却します。
   * 詳細ページやプレビュー表示で使用されます。
   *
   * @param id 記事ID
   * @param lang 言語コード
   * @returns 記事メタデータと翻訳データのペア。存在しない場合は undefined
   */
  async findById(id: string, lang: string): Promise<MetadataRow | undefined> {
    try {
      const result = await db
        .select()
        .from(articles)
        .innerJoin(articleTranslations, eq(articles.id, articleTranslations.articleId))
        .where(and(eq(articles.id, id), eq(articleTranslations.lang, lang)))
        .limit(1);

      return result[0];
    } catch (error) {
      this.logger.error('ArticleMetadataDataSource.findById error', error as Error, { id, lang });
      throw new AppError(
        'Failed to retrieve article metadata by ID',
        'INFRASTRUCTURE_ERROR',
        500,
        error,
      );
    }
  }

  /**
   * スラッグと言語コードを指定して記事のメタデータを取得します。
   * 任意でカテゴリを指定して絞り込むことも可能です。
   * 公開ステータスに関わらず取得します。
   *
   * @param slug 記事のスラッグ
   * @param lang 言語コード
   * @param category 記事カテゴリ（オプション）
   * @returns 記事メタデータと翻訳データのペア。存在しない場合は undefined
   */
  async findBySlug(
    slug: string,
    lang: string,
    category?: ArticleCategory, // 型をEnumに厳格化
  ): Promise<MetadataRow | undefined> {
    try {
      // string で渡ってきた場合に備えて Enum として扱う
      const filters = [eq(articles.slug, slug), eq(articleTranslations.lang, lang)];

      if (category) {
        filters.push(eq(articles.category, category));
      }

      const result = await db
        .select()
        .from(articles)
        .innerJoin(articleTranslations, eq(articles.id, articleTranslations.articleId))
        .where(and(...filters))
        .limit(1);

      return result[0];
    } catch (error) {
      this.logger.error('ArticleMetadataDataSource.findBySlug error', error as Error, {
        slug,
        lang,
        category,
      });
      throw new AppError(
        'Failed to retrieve article metadata by slug',
        'INFRASTRUCTURE_ERROR',
        500,
        error,
      );
    }
  }

  /**
   * 指定された検索条件に基づいて記事メタデータの一覧を取得します。
   * ページネーション、ソート、フィルタリング（カテゴリ、キーワード、ステータス等）に対応しています。
   *
   * @param criteria 検索条件（フィルタ、ソート、ページネーション設定が含まれるオブジェクト）
   * @returns 検索結果の行配列と、条件に合致する総件数を含むオブジェクト
   */
  async findMany(criteria: ArticleSearchCriteria) {
    try {
      const { filter, sort, pagination } = criteria;
      const filters = [];

      // --- 1. Filter Construction ---

      // 言語 (必須)
      filters.push(eq(articleTranslations.lang, filter.lang));

      // ステータス: 空配列の場合はフィルタしない、あるいはデフォルト(PUBLISHED)を設定
      const targetStatuses = filter.status?.length ? filter.status : [ArticleStatus.PUBLISHED];
      filters.push(inArray(articleTranslations.status, targetStatuses));

      if (filter.category) {
        filters.push(eq(articles.category, filter.category));
      }

      if (filter.isFeatured !== undefined) {
        filters.push(eq(articleTranslations.isFeatured, filter.isFeatured));
      }

      // キーワード検索 (FTS導入までの暫定対応としての LIKE 改善版)
      if (filter.keyword) {
        const pattern = `%${filter.keyword}%`;
        const scope = filter.keywordScope || ArticleKeywordScope.ALL;
        const keywordConditions = [];

        // スコープ定義に基づいて検索対象を決定
        const searchTitle =
          scope === ArticleKeywordScope.TITLE || scope === ArticleKeywordScope.ALL;
        const searchSummary =
          scope === ArticleKeywordScope.SUMMARY || scope === ArticleKeywordScope.ALL;

        if (searchTitle) {
          keywordConditions.push(like(articleTranslations.title, pattern));
          keywordConditions.push(like(articleTranslations.displayTitle, pattern));
        }

        if (searchSummary) {
          keywordConditions.push(like(articleTranslations.excerpt, pattern));
          // スキーマにカラムが存在する前提で追加 (データがNULLならヒットしないだけなので安全)
          // 以前の if (articleTranslations.catchcopy) は定義情報の判定だったので削除
          keywordConditions.push(like(articleTranslations.catchcopy, pattern));
        }

        if (keywordConditions.length > 0) {
          filters.push(or(...keywordConditions));
        }
      }

      // --- 2. Sort Strategy ---

      const sortMapping: Partial<Record<ArticleSortOption, AnyColumn>> = {
        [ArticleSortOption.TITLE]: articleTranslations.displayTitle,
        [ArticleSortOption.PERFORMANCE_DIFFICULTY]: articleTranslations.slPerformanceDifficulty,
        [ArticleSortOption.PUBLISHED_AT]: articleTranslations.publishedAt,
      };

      const sortField = sort?.field || ArticleSortOption.PUBLISHED_AT;
      const targetColumn = sortMapping[sortField] ?? articleTranslations.publishedAt;

      const direction = sort?.direction === SortDirection.ASC ? asc : desc;
      const orderByClause = direction(targetColumn);

      // --- 3. Execution ---

      // Drizzleのクエリビルダは状態を持つことがあるため、
      // count用とselect用でクエリ定義を分けて明示的に構築

      const rowsPromise = db
        .select()
        .from(articles)
        .innerJoin(articleTranslations, eq(articles.id, articleTranslations.articleId))
        .where(and(...filters))
        .orderBy(orderByClause)
        .limit(pagination.limit)
        .offset(pagination.offset);

      const countPromise = db
        .select({ count: sql<number>`count(*)` })
        .from(articles)
        .innerJoin(articleTranslations, eq(articles.id, articleTranslations.articleId))
        .where(and(...filters));

      const [rows, countResult] = await Promise.all([rowsPromise, countPromise]);

      return {
        rows,
        totalCount: Number(countResult[0]?.count || 0),
      };
    } catch (error) {
      this.logger.error('ArticleMetadataDataSource.findMany error', error as Error, { criteria });
      throw new AppError(
        'Failed to retrieve article metadata list',
        'INFRASTRUCTURE_ERROR',
        500,
        error,
      );
    }
  }
}
