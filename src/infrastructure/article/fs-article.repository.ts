import { ArticleRepository, ArticleSearchCriteria } from '@/domain/article/ArticleRepository';
import { Article, ContentStructure, ContentSection } from '@/domain/article/Article';
import { ArticleCategory } from '@/domain/article/ArticleMetadata';
import { PagedResponse } from '@/domain/shared/Pagination';
import { ArticleSortOption, SortDirection } from '@/domain/article/ArticleConstants';
import { INITIAL_ENGAGEMENT_METRICS } from '@/domain/article/ArticleEngagement';
import { FsArticleMetadataDataSource, FsArticleContext } from './fs-article-metadata.ds';
import { FsArticleContentDataSource } from './fs-article-content.ds';

export class FsArticleRepository implements ArticleRepository {
  constructor(
    private metadataDS: FsArticleMetadataDataSource,
    private contentDS: FsArticleContentDataSource
  ) { }

  async findBySlug(lang: string, category: ArticleCategory, slug: string): Promise<Article | null> {
    const context = await this.metadataDS.findBySlug(lang, category, slug);
    if (!context) return null;

    const contentBody = await this.contentDS.getContent(context.filePath);
    return this.mapToDomain(context, contentBody);
  }

  async findById(id: string): Promise<Article | null> {
    // FS implementation assumes slug usually, but we can scan
    const all = await this.metadataDS.findAll();
    const match = all.find(c => c.id === id); // id is slug in FS context
    if (!match) return null;

    const contentBody = await this.contentDS.getContent(match.filePath);
    return this.mapToDomain(match, contentBody);
  }

  async findMany(criteria: ArticleSearchCriteria): Promise<PagedResponse<Article>> {
    const allContexts = await this.metadataDS.findAll();
    // In-memory filtering (could be optimized deeply in DS but composed repo does it here for now)

    // Convert to domain objects for filtering (or filter contexts first? Context has metadata)
    // Filter by context/metadata first for perf.

    let candidates = allContexts;

    // 1. Language
    if (criteria.lang) {
      candidates = candidates.filter(c => c.lang === criteria.lang);
    }

    // 2. Status
    if (criteria.status && criteria.status.length > 0) {
      candidates = candidates.filter(c => criteria.status!.includes(c.status));
    }

    // 3. Category
    if (criteria.category) {
      candidates = candidates.filter(c => c.category === criteria.category);
    }

    // 4. Tags
    if (criteria.tags && criteria.tags.length > 0) {
      candidates = candidates.filter(c =>
        criteria.tags!.every(tag => c.metadata.tags.includes(tag))
      );
    }

    // Series, Features, Metadata filters...
    if (criteria.isFeatured !== undefined) {
      candidates = candidates.filter(c => c.metadata.isFeatured === criteria.isFeatured);
    }
    if (criteria.minReadingLevel) {
      candidates = candidates.filter(c => (c.metadata.readingLevel || 0) >= criteria.minReadingLevel!);
    }
    if (criteria.maxReadingLevel) {
      candidates = candidates.filter(c => (c.metadata.readingLevel || 0) <= criteria.maxReadingLevel!);
    }

    // Sort
    const sortOption = criteria.sortBy || ArticleSortOption.PUBLISHED_AT;
    const direction = criteria.sortDirection || SortDirection.DESC;
    const modifier = direction === SortDirection.ASC ? 1 : -1;

    candidates.sort((a, b) => {
      /* Simplified Sort Logic for Context */
      let valA: any = 0, valB: any = 0;
      switch (sortOption) {
        case ArticleSortOption.PUBLISHED_AT:
          valA = a.metadata.publishedAt ? a.metadata.publishedAt.getTime() : 0;
          valB = b.metadata.publishedAt ? b.metadata.publishedAt.getTime() : 0;
          break;
        // ... implement other sorts if needed
        default:
          valA = a.createdAt.getTime();
          valB = b.createdAt.getTime();
      }
      if (valA < valB) return -1 * modifier;
      if (valA > valB) return 1 * modifier;
      return 0;
    });

    // Pagination
    const totalCount = candidates.length;
    const offset = criteria.offset || 0;
    const limit = criteria.limit || 20;
    const pagedCandidates = candidates.slice(offset, offset + limit);

    // Map to Domain (Heavy lifting: reading content)
    // Note: findMany typically returns Articles which contain Content (Body).
    // In many real systems list view might return "Light Article" (no body).
    // Domain definition requires 'content'.
    const items: Article[] = [];
    for (const c of pagedCandidates) {
      const body = await this.contentDS.getContent(c.filePath);
      items.push(this.mapToDomain(c, body));
    }

    return {
      items,
      totalCount,
      hasNextPage: offset + limit < totalCount,
    };
  }

  async save(article: Article): Promise<void> {
    throw new Error('Save not implemented in Composed Repository (Use legacy or finish implementation)');
  }

  async delete(id: string): Promise<void> {
    throw new Error('Delete not implemented');
  }

  // Mapper
  private mapToDomain(context: FsArticleContext, body: string): Article {
    const structure = this.extractToc(body);
    return new Article({
      control: {
        id: context.id,
        lang: context.lang as any,
        status: context.status,
        createdAt: context.createdAt,
        updatedAt: context.updatedAt,
      },
      metadata: context.metadata,
      content: {
        body: body,
        structure: structure,
      },
      engagement: { metrics: INITIAL_ENGAGEMENT_METRICS },
      context: {
        seriesAssignments: [],
        relatedArticles: [],
        sourceAttributions: [],
        monetizationElements: [],
      }
    });
  }

  private extractToc(content: string): ContentStructure {
    // Copy regex logic logic
    const lines = content.split('\n');
    const sections: ContentStructure = [];
    let currentH2: ContentSection | null = null;
    const h2Regex = /^##\s+(.+)$/;
    const h3Regex = /^###\s+(.+)$/;

    for (const line of lines) {
      const h2Match = line.match(h2Regex);
      if (h2Match) {
        currentH2 = { id: this.slugify(h2Match[1]), heading: h2Match[1], level: 2, children: [] };
        sections.push(currentH2);
        continue;
      }
      const h3Match = line.match(h3Regex);
      if (h3Match && currentH2) {
        currentH2.children = currentH2.children || [];
        currentH2.children.push({ id: this.slugify(h3Match[1]), heading: h3Match[1], level: 3 });
      }
    }
    return sections;
  }

  private slugify(text: string): string {
    return text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\-]+/g, '');
  }
}
