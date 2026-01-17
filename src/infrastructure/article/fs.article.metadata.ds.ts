import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import {
  ArticleCategory,
  ArticleMetadata,
  ArticleMetadataSchema,
} from '@/domain/article/article.metadata';
import { ContentStructure, ContentSection } from '@/domain/article/article';
import { ArticleStatus } from '@/domain/article/article.control';
import { logger } from '@/infrastructure/logging';
import {
  IArticleMetadataDataSource,
  MetadataRow,
} from './interfaces/article.metadata.ds.interface';
import { ArticleSearchCriteria } from '@/domain/article/article.repository';

export interface FsArticleContext {
  id: string; // slug for FS
  slug: string;
  lang: string;
  category: ArticleCategory;
  status: ArticleStatus;
  filePath: string;
  metadata: ArticleMetadata;
  contentStructure: ContentStructure;
  createdAt: Date;
  updatedAt: Date;
}

export class FsArticleMetadataDataSource implements IArticleMetadataDataSource {
  private readonly contentDirectory: string;

  constructor(contentDir?: string) {
    this.contentDirectory = contentDir || path.join(process.cwd(), 'article');
  }

  async findById(id: string, lang: string): Promise<MetadataRow | undefined> {
    // FS implementation treats ID as Slug mostly, but it's inefficient to search by ID (File scan).
    // For now, iterate all files to find matching ID.
    // However, in FS implementation, ID was defined as `slug`.
    const all = await this.findAllContexts();
    const match = all.find((c) => c.id === id && c.lang === lang);
    if (!match) return undefined;
    return this.mapToMetadataRow(match);
  }

  async findBySlug(
    slug: string,
    lang: string,
    category?: ArticleCategory,
  ): Promise<MetadataRow | undefined> {
    // If category is provided, faster lookup
    if (category) {
      const filePath = path.join(this.contentDirectory, lang, category, `${slug}.mdx`);
      if (fs.existsSync(filePath)) {
        const context = await this.parseMetadata(filePath, lang, category, slug);
        return context ? this.mapToMetadataRow(context) : undefined;
      }
      return undefined;
    }

    // Scan all categories if not provided
    const contexts = await this.findAllContexts();
    const match = contexts.find((c) => c.slug === slug && c.lang === lang);
    return match ? this.mapToMetadataRow(match) : undefined;
  }

  async findMany(criteria: ArticleSearchCriteria): Promise<{
    rows: MetadataRow[];
    totalCount: number;
  }> {
    const contexts = await this.findAllContexts();
    const { filter } = criteria;
    let candidates = contexts;

    if (filter.lang) {
      candidates = candidates.filter((c) => c.lang === filter.lang);
    }
    if (filter.status && filter.status.length > 0) {
      candidates = candidates.filter((c) => filter.status!.includes(c.status));
    }
    if (filter.category) {
      candidates = candidates.filter((c) => c.category === filter.category);
    }
    if (filter.tags && filter.tags.length > 0) {
      candidates = candidates.filter((c) =>
        filter.tags!.every((tag) => c.metadata.tags.includes(tag)),
      );
    }
    if (filter.isFeatured !== undefined) {
      candidates = candidates.filter((c) => c.metadata.isFeatured === filter.isFeatured);
    }
    // Keyword search omitted for simplicity, similar to original

    // Filtering logic matches original `FsArticleRepository.findMany` roughly.
    // Sorting and Pagination should ideally happen here too for strict interface compliance,
    // but the interface returns `rows` and `totalCount`.
    // We will return ALL matching rows and let the Repository layer handle pagination/sort if it wants?
    // Wait, typical generic repository expects DS to handle pagination.
    // Currently Turso implementation handles it in SQL.
    // Here we must handle in memory.

    const totalCount = candidates.length;
    // Apply Pagination
    const offset = criteria.pagination.offset || 0;
    const limit = criteria.pagination.limit || 20;
    const pagedCandidates = candidates.slice(offset, offset + limit);

    return {
      rows: pagedCandidates.map((c) => this.mapToMetadataRow(c)),
      totalCount,
    };
  }

  // --- Helpers ---

  // Re-expose for legacy use if needed, but preferably internal
  private async findAllContexts(): Promise<FsArticleContext[]> {
    const categories = Object.values(ArticleCategory);
    if (!fs.existsSync(this.contentDirectory)) return [];

    const langs = fs
      .readdirSync(this.contentDirectory)
      .filter((f) => fs.statSync(path.join(this.contentDirectory, f)).isDirectory());

    const results: FsArticleContext[] = [];

    for (const lang of langs) {
      for (const category of categories) {
        const dirPath = path.join(this.contentDirectory, lang, category as string);
        if (fs.existsSync(dirPath)) {
          const files = this.getAllMdxFiles(dirPath);
          for (const filePath of files) {
            const relativePath = path.relative(dirPath, filePath);
            const slug = relativePath.replace(/\\/g, '/').replace(/\.mdx$/, '');
            const context = await this.parseMetadata(
              filePath,
              lang,
              category as ArticleCategory,
              slug,
            );
            if (context) results.push(context);
          }
        }
      }
    }
    return results;
  }

  private getAllMdxFiles(dir: string): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return [];

    const list = fs.readdirSync(dir);
    list.forEach((file) => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      if (stat && stat.isDirectory()) {
        results = results.concat(this.getAllMdxFiles(filePath));
      } else if (file.endsWith('.mdx')) {
        results.push(filePath);
      }
    });
    return results;
  }

  private async parseMetadata(
    filePath: string,
    lang: string,
    category: ArticleCategory,
    slug: string,
  ): Promise<FsArticleContext | null> {
    try {
      const fileContents = fs.readFileSync(filePath, 'utf8');
      const { data, content } = matter(fileContents);

      const dataToValidate = {
        ...data,
        slug: data.slug || slug,
        category: data.category || category,
      };

      let metadata: ArticleMetadata;
      const parseResult = ArticleMetadataSchema.safeParse(dataToValidate);

      if (parseResult.success) {
        metadata = parseResult.data;
      } else {
        metadata = this.mapLegacyMetadata(dataToValidate);
      }

      metadata.slug = slug;
      metadata.category = category;
      const isFeatured = !!data.isFeatured;
      metadata.isFeatured = isFeatured;
      metadata.readingTimeSeconds = data.readingTimeSeconds || 0;

      const dateStr = data.publishedAt || data.date;
      const date = dateStr ? new Date(dateStr) : null;
      metadata.publishedAt = date;

      const status = (data.status as ArticleStatus) || ArticleStatus.PUBLISHED;

      // Extract TOC
      const contentStructure = this.extractToc(content);

      return {
        id: slug, // Using slug as ID for FS
        slug,
        lang,
        category,
        status,
        filePath,
        metadata,
        contentStructure,
        createdAt: date || new Date(),
        updatedAt: fs.statSync(filePath).mtime,
      };
    } catch (e) {
      logger.warn(`Failed to parse metadata: ${filePath}`, { error: e });
      return null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapLegacyMetadata(data: any): ArticleMetadata {
    const difficultyMap: Record<string, number> = {
      Beginner: 1,
      Intermediate: 3,
      Advanced: 5,
      Professional: 5,
      Virtuoso: 5,
    };
    const level = difficultyMap[data.difficulty] || 3;

    return {
      title: data.title || 'No Title',
      catchcopy: data.catchcopy || undefined,
      displayTitle: data.displayTitle || data.title,
      excerpt: data.excerpt || data.ogp_excerpt || undefined,
      composerName: data.composer || data.composerName || 'Unknown',
      workTitle: data.workTitle || data.work || undefined,
      workCatalogueId: undefined,
      instrumentations: [],
      genre: undefined,
      era: undefined,
      nationality: undefined,
      key: data.key,
      readingLevel: level,
      performanceDifficulty: level,
      slug: data.slug || 'unknown',
      category: data.category || ArticleCategory.WORKS,
      isFeatured: !!data.isFeatured,
      readingTimeSeconds: data.readingTimeSeconds || 0,
      playback: data.audioSrc
        ? {
            audioSrc: data.audioSrc,
            performer: data.performer,
            startSeconds: data.startSeconds,
            endSeconds: data.endSeconds,
          }
        : undefined,
      thumbnail: data.thumbnail,
      tags: data.tags || [],
      publishedAt: data.date ? new Date(data.date) : null,
    };
  }

  private mapToMetadataRow(context: FsArticleContext): MetadataRow {
    // Construct MDX Path: lang/category/slug
    const mdxPath = `${context.lang}/${context.category}/${context.slug}`;

    return {
      articles: {
        id: context.id,
        workId: null,
        slug: context.slug,
        category: context.category,
        isFeatured: context.metadata.isFeatured,
        readingTimeSeconds: context.metadata.readingTimeSeconds,
        thumbnailPath: context.metadata.thumbnail || null,
        createdAt: context.createdAt.toISOString(),
        updatedAt: context.updatedAt.toISOString(),
      },
      article_translations: {
        id: `${context.id}-${context.lang}`, // Mock ID
        articleId: context.id,
        lang: context.lang,
        status: context.status,
        title: context.metadata.title,
        displayTitle: context.metadata.displayTitle,
        catchcopy: context.metadata.catchcopy || null,
        excerpt: context.metadata.excerpt || null,
        publishedAt: context.metadata.publishedAt?.toISOString() || null,
        isFeatured: context.metadata.isFeatured,
        mdxPath: mdxPath,
        slSlug: context.slug,
        slCategory: context.category,
        slComposerName: context.metadata.composerName || null,
        slWorkCatalogueId: null,
        slWorkNicknames: null,
        slGenre: null,
        slInstrumentations: null,
        slEra: null,
        slNationality: null,
        slKey: context.metadata.key || null,
        slPerformanceDifficulty: context.metadata.performanceDifficulty || null,
        slImpressionDimensions: null,
        contentEmbedding: null,
        slSeriesAssignments: [],
        metadata: context.metadata,
        contentStructure: context.contentStructure,
        createdAt: context.createdAt.toISOString(),
        updatedAt: context.updatedAt.toISOString(),
      },
    };
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
