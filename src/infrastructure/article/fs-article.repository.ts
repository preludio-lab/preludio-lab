import { ArticleRepository, ArticleSearchCriteria } from '@/domain/article/ArticleRepository';
import { ArticleCategory } from '@/domain/article/ArticleMetadata';
import { Article, ContentStructure, ContentSection } from '@/domain/article/Article';
import { PagedResponse } from '@/domain/shared/Pagination';
import {
  IArticleMetadataDataSource,
  MetadataRow,
} from './interfaces/article-metadata-data-source.interface';
import { IArticleContentDataSource } from './interfaces/article-content-data-source.interface';
import { Logger } from '@/shared/logging/logger';
import { AppError } from '@/domain/shared/AppError';
import { TursoArticleMapper } from './turso-article.mapper';

export class FsArticleRepository implements ArticleRepository {
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
        this.logger.warn(`Article not found by slug: ${slug} (${lang})`, {
          category,
          slug,
          lang,
        });
        return null;
      }
      return await this._assembleArticle(row, slug);
    } catch (err) {
      if (err instanceof AppError) throw err;
      this.logger.error(`FindBySlug failed: ${slug}`, err as Error, {
        slug,
        lang,
        category,
      });
      throw new AppError('Database error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  async findMany(criteria: ArticleSearchCriteria): Promise<PagedResponse<Article>> {
    try {
      // 1. Get metadata rows
      const { rows, totalCount } = await this.metadataDS.findMany(criteria);

      // 2. Map to domain
      // For list view, we usually don't need full content, but legacy FS repo loaded content.
      // However, Turso repo optimistically skips content loading for lists.
      // We should align with Turso behavior for performance?
      // But if we skip content, we lose TOC structure which might be needed for display?
      // Usually list views don't show TOC.
      // So passing null content is fine.

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
        totalCount,
        hasNextPage:
          (criteria.pagination.offset || 0) + (criteria.pagination.limit || 20) < totalCount,
      };
    } catch (err) {
      this.logger.error('FindMany failed', err as Error);
      throw new AppError('Database error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  async save(article: Article): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = article;
    throw new Error('Method not implemented.');
  }

  async delete(id: string): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = id;
    throw new Error('Method not implemented.');
  }

  // --- Private Helpers ---

  private async _assembleArticle(row: MetadataRow, contextId: string): Promise<Article> {
    let content = '';

    // FS Data Source constructs mdxPath as "lang/category/slug"
    // FsContentDS expects path relative to article root if not absolute.
    // row.article_translations.mdxPath is "lang/category/slug" (no extension).
    // We need adding extension.
    if (row.article_translations.mdxPath) {
      const fullPath = `${row.article_translations.mdxPath}.mdx`;
      try {
        content = await this.contentDS.getContent(fullPath);
      } catch (err) {
        this.logger.error(`Content fetch failed: ${fullPath}`, err as Error, { contextId });
        throw new AppError('Content fetch failed', 'INFRASTRUCTURE_ERROR', 500, err);
      }
    }

    // Dynamic TOC generation for FS
    const structure = this.extractToc(content);
    row.article_translations.contentStructure = structure;

    try {
      return TursoArticleMapper.toDomain(row.articles, row.article_translations, content);
    } catch (err) {
      this.logger.error(`Mapping failed: ${contextId}`, err as Error, { contextId });
      throw new AppError('Data mapping error', 'INTERNAL_SERVER_ERROR', 500, err);
    }
  }

  private extractToc(content: string): ContentStructure {
    const lines = content.split('\n');
    const sections: ContentStructure = [];
    let currentH2: ContentSection | null = null;
    const h2Regex = /^##\s+(.+)$/;
    const h3Regex = /^###\s+(.+)$/;

    for (const line of lines) {
      const h2Match = line.match(h2Regex);
      if (h2Match) {
        currentH2 = {
          id: this.slugify(h2Match[1]),
          heading: h2Match[1],
          level: 2,
          children: [],
        };
        sections.push(currentH2);
        continue;
      }
      const h3Match = line.match(h3Regex);
      if (h3Match && currentH2) {
        currentH2.children = currentH2.children || [];
        currentH2.children.push({
          id: this.slugify(h3Match[1]),
          heading: h3Match[1],
          level: 3,
        });
      }
    }
    return sections;
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\-]+/g, '');
  }
}
