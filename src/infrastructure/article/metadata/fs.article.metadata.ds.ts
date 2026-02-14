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
import { IArticleMetadataDataSource, ArticleMetadataRow } from './article.metadata.ds.interface';
import { ArticleSearchCriteria } from '@/domain/article/article.repository';

/**
 * ファイルシステム上の記事コンテキスト情報
 */
export interface FsArticleContext {
  id: string; // FS用のスラグ
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

  /**
   * IDと言語コードを指定して記事のメタデータを取得します。
   */
  async findById(id: string, lang: string): Promise<ArticleMetadataRow | undefined> {
    const all = await this.findAllContexts();
    const match = all.find((c) => c.id === id && c.lang === lang);
    if (!match) return undefined;
    return this.toRow(match);
  }

  /**
   * スラッグと言語コードを指定して記事のメタデータを取得します。
   */
  async findBySlug(
    slug: string,
    lang: string,
    category?: ArticleCategory,
  ): Promise<ArticleMetadataRow | undefined> {
    const contexts = await this.findAllContexts();

    const match = contexts.find((c) => {
      const isSlugMatch = c.slug === slug;
      const isLangMatch = c.lang === lang;
      const isCategoryMatch = category ? c.category === category : true;
      return isSlugMatch && isLangMatch && isCategoryMatch;
    });

    return match ? this.toRow(match) : undefined;
  }

  /**
   * 指定された検索条件に基づいて記事メタデータの一覧を取得します。
   */
  async findMany(criteria: ArticleSearchCriteria): Promise<{
    rows: ArticleMetadataRow[];
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
    const offset = criteria.pagination.offset || 0;
    const limit = criteria.pagination.limit || 20;
    const pagedCandidates = candidates.slice(offset, offset + limit);

    return {
      rows: pagedCandidates.map((c) => this.toRow(c)),
      totalCount,
    };
  }

  /**
   * メタデータを保存します (FS版は現状読み取り専用のため、ログ出力のみ)。
   */
  async save(_row: ArticleMetadataRow): Promise<void> {
    logger.info(
      `FsArticleMetadataDataSource.save called for ID: ${_row.articles.id} (not implemented for FS)`,
    );
  }

  /**
   * 特定の言語の翻訳レコードを削除します。
   */
  async deleteTranslation(id: string, lang: string): Promise<void> {
    logger.info(`FsArticleMetadataDataSource.deleteTranslation called for ID: ${id} [${lang}]`);
  }

  /**
   * 指定された ID に紐づく翻訳レコードの総数を取得します。
   */
  async countTranslations(id: string): Promise<number> {
    const all = await this.findAllContexts();
    return all.filter((c) => c.id === id).length;
  }

  /**
   * 指定された ID に紐づく全ての翻訳メタデータを取得します（全言語）。
   */
  async findAllTranslations(id: string): Promise<ArticleMetadataRow[]> {
    const all = await this.findAllContexts();
    return all.filter((c) => c.id === id).map((c) => this.toRow(c));
  }

  /**
   * 指定された ID の Master レコードと全ての翻訳レコードを削除します。
   */
  async deleteAll(id: string): Promise<void> {
    logger.info(`FsArticleMetadataDataSource.deleteAll called for ID: ${id}`);
  }

  // --- ヘルパーメソッド ---

  /**
   * ファイルシステムを走査し、全ての記事コンテキストを取得します。
   */
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

      interface ScanResult {
        filePath: string;
        lang: string;
        category: ArticleCategory;
        slug: string;
      }

      const scanDir = (dir: string): ScanResult[] => {
        const items = fs.readdirSync(dir);

        if (items.includes('mdx')) {
          const mdxDirPath = path.join(dir, 'mdx');
          const slug = path.relative(categoryPath, dir).replace(/\\/g, '/');

          const langFiles = fs.readdirSync(mdxDirPath).filter((f) => f.endsWith('.mdx'));
          const articleResults: ScanResult[] = [];
          for (const langFile of langFiles) {
            const lang = langFile.replace(/\.mdx$/, '');
            const filePath = path.join(mdxDirPath, langFile);
            articleResults.push({ filePath, lang, category, slug });
          }
          return articleResults;
        }

        let subResults: ScanResult[] = [];
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

  /**
   * MDXファイルをパースしてメタデータとコンテンツ情報を抽出します。
   */
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

      const contentStructure = this.extractToc(content);

      return {
        id: slug,
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

  /**
   * レガシーなメタデータ構造を新しいArticleMetadataにマッピングします。
   */
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

  /**
   * FsArticleContextをArticleMetadataRow（DB互換形式）に変換します。
   */
  private toRow(context: FsArticleContext): ArticleMetadataRow {
    const article = {
      id: context.id,
      workId: null,
      slug: context.slug,
      category: context.category,
      isFeatured: context.metadata.isFeatured,
      readingTimeSeconds: context.metadata.readingTimeSeconds,
      thumbnailPath: context.metadata.thumbnail || null,
      createdAt: context.createdAt.toISOString(),
      updatedAt: context.updatedAt.toISOString(),
    };

    const translation = {
      id: `${context.id}-${context.lang}`,
      articleId: context.id,
      lang: context.lang,
      status: context.status,
      title: context.metadata.title,
      displayTitle: context.metadata.displayTitle,
      catchcopy: context.metadata.catchcopy || null,
      excerpt: context.metadata.excerpt || null,
      publishedAt: context.metadata.publishedAt?.toISOString() || null,
      isFeatured: context.metadata.isFeatured,
      mdxPath: null, // Generated in DB, but required in type
      slSlug: context.slug,
      slCategory: context.category,
      slComposerName: context.metadata.composerName || null,
      slWorkCatalogueId: context.metadata.workCatalogueId || null,
      slWorkNicknames: [],
      slGenre: [],
      slInstrumentations: context.metadata.instrumentations || [],
      slEra: context.metadata.era || null,
      slNationality: context.metadata.nationality || null,
      slKey: context.metadata.key || null,
      slPerformanceDifficulty: context.metadata.performanceDifficulty || null,
      slImpressionDimensions: null,
      slSeriesAssignments: [],
      metadata: context.metadata,
      contentStructure: context.contentStructure,
      createdAt: context.createdAt.toISOString(),
      updatedAt: context.updatedAt.toISOString(),
    };

    return {
      articles: article,
      article_translations: translation,
    };
  }

  /**
   * MDXコンテンツから目次構造を抽出します。
   */
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

  /**
   * テキストをURLセーフなスラグに変換します。
   */
  private slugify(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\-]+/g, '');
  }
}
