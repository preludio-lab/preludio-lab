import { ArticleRepository, ArticleSearchCriteria } from '@/domain/article/ArticleRepository';
import { ArticleCategory } from '@/domain/article/ArticleMetadata';
import { Article } from '@/domain/article/Article';
import { PagedResponse } from '@/domain/shared/Pagination';
import { ArticleMetadataDataSource } from './turso-article-metadata.ds';
import { ArticleContentDataSource } from './r2-article-content.ds';
import { Logger } from '@/shared/logging/logger';
import { AppError } from '@/domain/shared/AppError';
import { TursoArticleMapper } from './turso-article.mapper';

export class TursoArticleRepository implements ArticleRepository {
  constructor(
    private metadataDS: ArticleMetadataDataSource,
    private contentDS: ArticleContentDataSource,
    private logger: Logger,
  ) {}

  async findById(id: string, lang: string): Promise<Article | null> {
    // 1. Fetch Metadata
    let row;
    try {
      row = await this.metadataDS.findById(id, lang);
    } catch (err) {
      this.logger.error(`Metadata fetch failed: ${id}`, err as Error, { id, lang });
      throw new AppError('Database error', 'INFRASTRUCTURE_ERROR', 500, err);
    }

    // 2. Handle Not Found (Business Logic)
    if (!row) {
      this.logger.warn(`Article not found by ID: ${id} (${lang})`, { id, lang });
      throw new AppError(`Article not found: ${id}`, 'NOT_FOUND', 404);
    }

    // 3. Fetch Content (MDX)
    let content = '';
    if (row.article_translations.mdxPath) {
      try {
        content = await this.contentDS.getContent(row.article_translations.mdxPath);
      } catch (err) {
        this.logger.error(
          `Content fetch failed: ${row.article_translations.mdxPath}`,
          err as Error,
          { id },
        );
        throw new AppError('Content fetch failed', 'INFRASTRUCTURE_ERROR', 500, err);
      }
    }

    // 4. Map to Domain
    try {
      return TursoArticleMapper.toDomain(row.articles, row.article_translations, content);
    } catch (err) {
      this.logger.error(`Mapping failed for article: ${id}`, err as Error, { id });
      throw new AppError('Data mapping error', 'INTERNAL_SERVER_ERROR', 500, err);
    }
  }

  async findBySlug(lang: string, category: ArticleCategory, slug: string): Promise<Article | null> {
    // 1. Fetch Metadata
    let row;
    try {
      row = await this.metadataDS.findBySlug(slug, lang);
    } catch (err) {
      this.logger.error(`Metadata fetch failed: ${slug}`, err as Error, { slug, lang });
      throw new AppError('Database error', 'INFRASTRUCTURE_ERROR', 500, err);
    }

    // 2. Handle Not Found (Business Logic)
    if (!row) {
      this.logger.warn(`Article not found: ${slug} (${lang})`, { category, slug, lang });
      throw new AppError(`Article not found: ${slug}`, 'NOT_FOUND', 404);
    }

    // 3. Fetch Content (MDX)
    let content = '';
    if (row.article_translations.mdxPath) {
      try {
        content = await this.contentDS.getContent(row.article_translations.mdxPath);
      } catch (err) {
        this.logger.error(
          `Content fetch failed: ${row.article_translations.mdxPath}`,
          err as Error,
          { slug },
        );
        throw new AppError('Content fetch failed', 'INFRASTRUCTURE_ERROR', 500, err);
      }
    }

    // 4. Map to Domain
    try {
      return TursoArticleMapper.toDomain(row.articles, row.article_translations, content);
    } catch (err) {
      this.logger.error(`Mapping failed for article: ${slug}`, err as Error, { slug });
      throw new AppError('Data mapping error', 'INTERNAL_SERVER_ERROR', 500, err);
    }
  }

  async findMany(criteria: ArticleSearchCriteria): Promise<PagedResponse<Article>> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const c = criteria;
    // リストビューの実装
    return {
      items: [],
      totalCount: 0,
      hasNextPage: false,
    };
  }

  async save(_article: Article): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const a = _article;
    // 現時点では読み取り専用の実装
    throw new Error('Method not implemented.');
  }

  async delete(_id: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const i = _id;
    throw new Error('Method not implemented.');
  }
}
