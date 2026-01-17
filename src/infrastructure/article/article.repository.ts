import { ArticleRepository, ArticleSearchCriteria } from '@/domain/article/ArticleRepository';
import { ArticleCategory } from '@/domain/article/ArticleMetadata';
import { Article } from '@/domain/article/Article';
import { PagedResponse } from '@/domain/shared/Pagination';
import {
  IArticleMetadataDataSource,
  MetadataRow,
} from './interfaces/article-metadata-data-source.interface';
import { IArticleContentDataSource } from './interfaces/article-content-data-source.interface';
import { Logger } from '@/shared/logging/logger';
import { AppError } from '@/domain/shared/AppError';
import { TursoArticleMapper } from './turso-article.mapper';

export class ArticleRepositoryImpl implements ArticleRepository {
  constructor(
    private metadataDS: IArticleMetadataDataSource,
    private contentDS: IArticleContentDataSource,
    private logger: Logger,
  ) {}

  async findById(id: string, lang: string): Promise<Article | null> {
    try {
      const row = await this.metadataDS.findById(id, lang);
      if (!row) {
        this.logger.warn(`Article not found by ID: ${id} (${lang})`, { id, lang });
        return null;
      }

      return await this._assembleArticle(row, id);
    } catch (err) {
      if (err instanceof AppError) throw err;
      this.logger.error(`FindById failed: ${id}`, err as Error, { id, lang });
      throw new AppError('Database error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  async findBySlug(lang: string, category: ArticleCategory, slug: string): Promise<Article | null> {
    try {
      const row = await this.metadataDS.findBySlug(slug, lang, category);
      if (!row) {
        this.logger.warn(`Article not found by slug: ${slug} (${lang})`, { category, slug, lang });
        return null;
      }

      return await this._assembleArticle(row, slug);
    } catch (err) {
      if (err instanceof AppError) throw err;
      this.logger.error(`FindBySlug failed: ${slug}`, err as Error, { slug, lang, category });
      throw new AppError('Database error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  async findMany(criteria: ArticleSearchCriteria): Promise<PagedResponse<Article>> {
    try {
      // 1. Get metadata rows (Content fetch skipped for performance)
      const { rows, totalCount } = await this.metadataDS.findMany(criteria);

      // 2. Map to domain
      const items = rows
        .map((row) => {
          try {
            // Null content for list view
            return TursoArticleMapper.toDomain(row.articles, row.article_translations, null);
          } catch (e) {
            this.logger.error(`Mapping failed for article in list: ${row.articles.id}`, e as Error);
            return null;
          }
        })
        .filter((item): item is Article => item !== null);

      return {
        items,
        totalCount,
        hasNextPage:
          (criteria.pagination.offset || 0) + (criteria.pagination.limit || 20) < totalCount,
      };
    } catch (err) {
      this.logger.error('FindMany failed', err as Error);
      throw new AppError('Database error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async save(_: Article): Promise<void> {
    throw new Error('Method not implemented.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async delete(_: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  // --- Private Helpers ---

  private async _assembleArticle(row: MetadataRow, contextId: string): Promise<Article> {
    let content = '';

    // Fetch Content if path exists
    if (row.article_translations.mdxPath) {
      // Ensure extension if missing (FS DS might provide path without extension or with)
      // Turso mapper usually expects just path.
      // The contentDS usually takes the full path or relative path.
      // FsContentDS expects relative path, R2 expects key.
      // Let's assume standard behavior: mdxPath should be complete or we append .mdx if likely missing
      // However, FsArticleMetadataDS now sets mdxPath as "lang/category/slug" (no ext).
      // R2 likely sets it with extension or without?
      // Check TursoArticleRepository:
      //     const fullPath = `${row.article_translations.mdxPath}.mdx`;
      // It appends .mdx. So we should do the same here for consistency.

      const fullPath = row.article_translations.mdxPath.endsWith('.mdx')
        ? row.article_translations.mdxPath
        : `${row.article_translations.mdxPath}.mdx`;

      try {
        content = await this.contentDS.getContent(fullPath);
      } catch (err) {
        this.logger.error(`Content fetch failed: ${fullPath}`, err as Error, { contextId });
        throw new AppError('Content fetch failed', 'INFRASTRUCTURE_ERROR', 500, err);
      }
    }

    try {
      return TursoArticleMapper.toDomain(row.articles, row.article_translations, content);
    } catch (err) {
      this.logger.error(`Mapping failed: ${contextId}`, err as Error, { contextId });
      throw new AppError('Data mapping error', 'INTERNAL_SERVER_ERROR', 500, err);
    }
  }
}
