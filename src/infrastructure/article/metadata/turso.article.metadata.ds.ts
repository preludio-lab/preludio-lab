import { eq, and, desc, asc, inArray, like, or, sql, AnyColumn } from 'drizzle-orm';
import { db } from '../../database/turso.client';
import { articles, articleTranslations } from '../../database/schema';
import { ArticleCategory } from '@/domain/article/article.metadata';
import { ArticleStatus } from '@/domain/article/article.control';
import { ArticleSearchCriteria, ArticleKeywordScope } from '@/domain/article/article.repository';
import { ArticleSortOption, SortDirection } from '@/domain/article/article.constants';
import { Logger } from '@/shared/logging/logger';
import { AppError } from '@/domain/shared/app-error';

import { IArticleMetadataDataSource, ArticleMetadataRow } from './article.metadata.ds';

export class TursoArticleMetadataDataSource implements IArticleMetadataDataSource {
  constructor(private readonly logger: Logger) {}

  /**
   * IDと言語コードを指定して記事のメタデータを取得します。
   */
  async findById(id: string, lang: string): Promise<ArticleMetadataRow | undefined> {
    try {
      const result = await db
        .select({
          articles: articles,
          article_translations: articleTranslations,
        })
        .from(articles)
        .innerJoin(articleTranslations, eq(articles.id, articleTranslations.articleId))
        .where(and(eq(articles.id, id), eq(articleTranslations.lang, lang)))
        .limit(1);

      return result[0];
    } catch (error) {
      this.logger.error('TursoArticleMetadataDataSource.findById error', error as Error, {
        id,
        lang,
      });
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
   */
  async findBySlug(
    slug: string,
    lang: string,
    category?: ArticleCategory,
  ): Promise<ArticleMetadataRow | undefined> {
    try {
      // 検索ロジック:
      // 1. 翻訳側のスラッグ (slSlug) が一致する
      // 2. または、翻訳スラッグが未設定 (NULL) で、マスタースラッグ (articles.slug) が一致する (フォールバック)
      const slugCondition = or(
        eq(articleTranslations.slSlug, slug),
        and(sql`${articleTranslations.slSlug} IS NULL`, eq(articles.slug, slug)),
      );

      const filters = [slugCondition, eq(articleTranslations.lang, lang)];

      if (category) {
        filters.push(eq(articles.category, category));
      }

      const result = await db
        .select({
          articles: articles,
          article_translations: articleTranslations,
        })
        .from(articles)
        .innerJoin(articleTranslations, eq(articles.id, articleTranslations.articleId))
        .where(and(...filters))
        .limit(1);

      return result[0];
    } catch (error) {
      this.logger.error('TursoArticleMetadataDataSource.findBySlug error', error as Error, {
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
   */
  async findMany(
    criteria: ArticleSearchCriteria,
  ): Promise<{ rows: ArticleMetadataRow[]; totalCount: number }> {
    try {
      const { filter, sort, pagination } = criteria;
      const filters = [];

      filters.push(eq(articleTranslations.lang, filter.lang));

      const targetStatuses = filter.status?.length ? filter.status : [ArticleStatus.PUBLISHED];
      filters.push(inArray(articleTranslations.status, targetStatuses));

      if (filter.category) {
        filters.push(eq(articles.category, filter.category));
      }

      if (filter.isFeatured !== undefined) {
        filters.push(eq(articleTranslations.isFeatured, filter.isFeatured));
      }

      if (filter.keyword) {
        const pattern = `%${filter.keyword}%`;
        const scope = filter.keywordScope || ArticleKeywordScope.ALL;
        const keywordConditions = [];

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
          keywordConditions.push(like(articleTranslations.catchcopy, pattern));
        }

        if (keywordConditions.length > 0) {
          filters.push(or(...keywordConditions));
        }
      }

      const sortMapping: Partial<Record<ArticleSortOption, AnyColumn>> = {
        [ArticleSortOption.TITLE]: articleTranslations.displayTitle,
        [ArticleSortOption.PERFORMANCE_DIFFICULTY]: articleTranslations.slPerformanceDifficulty,
        [ArticleSortOption.PUBLISHED_AT]: articleTranslations.publishedAt,
      };

      const sortField = sort?.field || ArticleSortOption.PUBLISHED_AT;
      const targetColumn = sortMapping[sortField] ?? articleTranslations.publishedAt;

      const direction = sort?.direction === SortDirection.ASC ? asc : desc;
      const orderByClause = direction(targetColumn);

      const rowsPromise = db
        .select({
          articles: articles,
          article_translations: articleTranslations,
        })
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
        rows: rows,
        totalCount: Number(countResult[0]?.count || 0),
      };
    } catch (error) {
      this.logger.error('TursoArticleMetadataDataSource.findMany error', error as Error, {
        criteria,
      });
      throw new AppError(
        'Failed to retrieve article metadata list',
        'INFRASTRUCTURE_ERROR',
        500,
        error,
      );
    }
  }

  /**
   * メタデータを保存します。
   */
  async save(_row: ArticleMetadataRow): Promise<void> {
    // アーキテクチャ構成を優先し、現在はスキャフォールディング（実体は後ほど実装）
    this.logger.info(`TursoArticleMetadataDataSource.save called for ID: ${_row.articles.id}`);
    // TODO: Perform db.insert().onConflictDoUpdate() or equivalent
    // [Implementation Note]
    // Master data (articles table) should only be updated when specifically intended.
    // Use onConflictDoUpdate to control which columns are updated to prevent overwriting
    // master attributes (slug, thumbnail, etc.) when saving a translation.
  }

  /**
   * 特定の言語の翻訳レコードを削除します。
   */
  async deleteTranslation(id: string, lang: string): Promise<void> {
    try {
      await db
        .delete(articleTranslations)
        .where(and(eq(articleTranslations.articleId, id), eq(articleTranslations.lang, lang)));
      this.logger.info(`Deleted translation for article: ${id} [${lang}]`);
    } catch (error) {
      this.logger.error('TursoArticleMetadataDataSource.deleteTranslation error', error as Error, {
        id,
        lang,
      });
      throw new AppError(
        'Failed to delete article translation',
        'INFRASTRUCTURE_ERROR',
        500,
        error,
      );
    }
  }

  /**
   * 指定された ID に紐づく翻訳レコードの総数を取得します。
   */
  async countTranslations(id: string): Promise<number> {
    try {
      const result = await db
        .select({ count: sql<number>`count(*)` })
        .from(articleTranslations)
        .where(eq(articleTranslations.articleId, id));

      return Number(result[0]?.count || 0);
    } catch (error) {
      this.logger.error('TursoArticleMetadataDataSource.countTranslations error', error as Error, {
        id,
      });
      throw new AppError(
        'Failed to count article translations',
        'INFRASTRUCTURE_ERROR',
        500,
        error,
      );
    }
  }

  /**
   * 指定された ID に紐づく全ての翻訳メタデータを取得します（全言語）。
   */
  async findAllTranslations(id: string): Promise<ArticleMetadataRow[]> {
    try {
      const result = await db
        .select({
          articles: articles,
          article_translations: articleTranslations,
        })
        .from(articles)
        .innerJoin(articleTranslations, eq(articles.id, articleTranslations.articleId))
        .where(eq(articles.id, id));

      return result;
    } catch (error) {
      this.logger.error(
        'TursoArticleMetadataDataSource.findAllTranslations error',
        error as Error,
        {
          id,
        },
      );
      throw new AppError(
        'Failed to find all article translations',
        'INFRASTRUCTURE_ERROR',
        500,
        error,
      );
    }
  }

  /**
   * 指定された ID の Master レコードと全ての翻訳レコードを削除します。
   */
  async deleteAll(id: string): Promise<void> {
    try {
      // 外部キー制約（ON DELETE CASCADE）が設定されている場合は articles を消すだけで良いが、
      // 念のため明示的に両方消すか、トランザクションで囲む。
      await db.transaction(async (tx) => {
        await tx.delete(articleTranslations).where(eq(articleTranslations.articleId, id));
        await tx.delete(articles).where(eq(articles.id, id));
      });
      this.logger.info(`Permanently deleted article and all translations: ${id}`);
    } catch (error) {
      this.logger.error('TursoArticleMetadataDataSource.deleteAll error', error as Error, { id });
      throw new AppError(
        'Failed to delete article master and translations',
        'INFRASTRUCTURE_ERROR',
        500,
        error,
      );
    }
  }
}
