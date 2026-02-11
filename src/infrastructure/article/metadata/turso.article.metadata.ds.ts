import { eq, and, desc, asc, inArray, like, or, sql, AnyColumn } from 'drizzle-orm';
import { db } from '../../database/turso.client';
import { articles, articleTranslations } from '../../database/schema';
import { ArticleCategory } from '@/domain/article/article.metadata';
import { ArticleStatus } from '@/domain/article/article.control';
import { ArticleSearchCriteria, ArticleKeywordScope } from '@/domain/article/article.repository';
import { ArticleSortOption, SortDirection } from '@/domain/article/article.constants';
import { Logger } from '@/shared/logging/logger';
import { AppError } from '@/domain/shared/app-error';
import { Article } from '@/domain/article/article';

import { IArticleMetadataDataSource } from './article.metadata.ds.interface';
import { TursoArticleMapper } from './turso.article.mapper';

export class TursoArticleMetadataDataSource implements IArticleMetadataDataSource {
  constructor(private readonly logger: Logger) {}

  /**
   * IDと言語コードを指定して記事のメタデータを取得します。
   */
  async findById(id: string, lang: string): Promise<Article | undefined> {
    try {
      const result = await db
        .select()
        .from(articles)
        .innerJoin(articleTranslations, eq(articles.id, articleTranslations.articleId))
        .where(and(eq(articles.id, id), eq(articleTranslations.lang, lang)))
        .limit(1);

      const row = result[0];
      if (!row) return undefined;

      return TursoArticleMapper.toDomain(row.articles, row.article_translations, null);
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
  ): Promise<Article | undefined> {
    try {
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

      const row = result[0];
      if (!row) return undefined;

      return TursoArticleMapper.toDomain(row.articles, row.article_translations, null);
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
  ): Promise<{ items: Article[]; totalCount: number }> {
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

      const items = rows
        .map((row) => {
          try {
            return TursoArticleMapper.toDomain(row.articles, row.article_translations, null);
          } catch (e) {
            this.logger.error(`Mapping failed for article in list: ${row.articles.id}`, e as Error);
            return null;
          }
        })
        .filter((item): item is Article => item !== null);

      return {
        items,
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
}
