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
    const contexts = await this.findAllContexts();

    // Attempt to match by slug.
    // In our new structure, 'slug' might be 'beethoven/symphony-no-5'
    // but the incoming request might only have the last part or the whole path.
    // The most reliable match is finding the one where context.slug === incoming slug.
    const match = contexts.find((c) => {
      const isSlugMatch = c.slug === slug;
      const isLangMatch = c.lang === lang;
      const isCategoryMatch = category ? c.category === category : true;
      return isSlugMatch && isLangMatch && isCategoryMatch;
    });

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

  private async findAllContexts(): Promise<FsArticleContext[]> {
    if (!fs.existsSync(this.contentDirectory)) return [];

    const results: FsArticleContext[] = [];
    const categories = fs
      .readdirSync(this.contentDirectory)
      .filter((f) => fs.statSync(path.join(this.contentDirectory, f)).isDirectory());

    for (const categoryName of categories) {
      const category = categoryName as ArticleCategory;
      if (!Object.values(ArticleCategory).includes(category)) continue;

      const categoryPath = path.join(this.contentDirectory, categoryName);

      const scanDir = (dir: string) => {
        const items = fs.readdirSync(dir);

        // Check if this is an article root (contains mdx folder)
        if (items.includes('mdx')) {
          const mdxDirPath = path.join(dir, 'mdx');
          const slug = path.relative(categoryPath, dir).replace(/\\/g, '/');

          const langFiles = fs.readdirSync(mdxDirPath).filter((f) => f.endsWith('.mdx'));
          const articleResults = [];
          for (const langFile of langFiles) {
            const lang = langFile.replace(/\.mdx$/, '');
            const filePath = path.join(mdxDirPath, langFile);
            articleResults.push({ filePath, lang, category, slug });
          }
          return articleResults;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let subResults: any[] = [];
        for (const item of items) {
          const fullPath = path.join(dir, item);
          if (fs.statSync(fullPath).isDirectory() && item !== 'mdx' && item !== 'images') {
            subResults = subResults.concat(scanDir(fullPath));
          }
        }
        return subResults;
      };

      const found = scanDir(categoryPath);
      for (const info of found) {
        const context = await this.parseMetadata(
          info.filePath,
          info.lang,
          info.category,
          info.slug,
        );
        if (context) results.push(context);
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

    // Debug logging for missing composer
    const composerName = data.composer || data.composerName || 'Unknown';
    if (composerName === 'Unknown') {
      logger.warn('Legacy metadata mapping: Unknown composer', {
        slug: data.slug,
        title: data.title,
        availableKeys: Object.keys(data),
      });
    }

    return {
      title: data.title || 'No Title',
      catchcopy: data.catchcopy || undefined,
      displayTitle: data.displayTitle || data.title,
      excerpt: data.excerpt || data.ogp_excerpt || undefined,
      composerName: composerName,
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
