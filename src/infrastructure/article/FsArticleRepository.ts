import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { z } from 'zod';
import {
    ArticleRepository,
    ArticleSearchCriteria,
} from '@/domain/article/ArticleRepository';
import { Article, ContentSection, ContentStructure } from '@/domain/article/Article';
import {
    ArticleMetadataSchema,
    ArticleMetadata,
    ArticleCategory,
} from '@/domain/article/ArticleMetadata';
import { PagedResponse } from '@/domain/shared/Pagination';
import { ArticleStatus } from '@/domain/article/ArticleControl';
import {
    ArticleSortOption,
    SortDirection,
} from '@/domain/article/ArticleConstants';
import { INITIAL_ENGAGEMENT_METRICS } from '@/domain/article/ArticleEngagement';
import { logger } from '@/infrastructure/logging';

/**
 * File System Implementation of Article Repository
 * MDXファイルを正として記事を管理する。
 */
export class FsArticleRepository implements ArticleRepository {
    private readonly contentDirectory: string;

    constructor() {
        this.contentDirectory = path.join(process.cwd(), 'article');
    }

    /**
     * Slugから記事を取得
     */
    async findBySlug(lang: string, category: ArticleCategory, slug: string): Promise<Article | null> {
        const filePath = path.join(this.contentDirectory, lang, category, `${slug}.mdx`);
        if (fs.existsSync(filePath)) {
            return this.parseArticleFile(filePath, lang, category, slug);
        }

        return null;
    }

    /**
     * IDから記事を取得
     * FS実装では ID = Slug と仮定するか、frontmatterのidを探す。
     * ここでは簡易的に Slug = ID として扱うか、全走査が必要。
     * パフォーマンスのため、一旦 Slug = ID 前提の実装とする、または全走査。
     * 正確性を期すなら全走査だが、FSはDev用なので全走査で良い。
     */
    async findById(id: string): Promise<Article | null> {
        const allArticles = await this.getAllArticles();
        return allArticles.find((a) => a.id === id) || null;
    }

    /**
     * 条件検索・一覧取得
     */
    async findMany(criteria: ArticleSearchCriteria): Promise<PagedResponse<Article>> {
        let articles = await this.getAllArticles();

        // 1. Language Filter (Required)
        articles = articles.filter((a) => a.lang === criteria.lang);

        // 2. Status Filter
        if (criteria.status && criteria.status.length > 0) {
            articles = articles.filter((a) => criteria.status!.includes(a.status));
        }

        // 3. Category Filter
        if (criteria.category) {
            articles = articles.filter((a) => a.category === criteria.category);
        }

        // 4. Tags Filter (AND match)
        if (criteria.tags && criteria.tags.length > 0) {
            articles = articles.filter((a) =>
                criteria.tags!.every((tag) => a.metadata.tags.includes(tag))
            );
        }

        // 5. Series Filter
        if (criteria.seriesId) {
            articles = articles.filter((a) =>
                a.context.seriesAssignments.some((sa: any) => sa.seriesId === criteria.seriesId)
            );
        }

        // 6. Featured Filter
        if (criteria.isFeatured !== undefined) {
            articles = articles.filter((a) => a.metadata.isFeatured === criteria.isFeatured);
        }

        // 7. Metadata Filters
        if (criteria.composerId) {
            // composerId is not strictly stored in metadata in FS impl (we store Name).
            // Skip for FS or simulate if we map Name -> Id.
        }

        if (criteria.minReadingLevel) {
            articles = articles.filter(a => (a.metadata.readingLevel || 0) >= criteria.minReadingLevel!);
        }
        if (criteria.maxReadingLevel) {
            articles = articles.filter(a => (a.metadata.readingLevel || 0) <= criteria.maxReadingLevel!);
        }

        // Sort
        const sortOption = criteria.sortBy || ArticleSortOption.PUBLISHED_AT;
        const direction = criteria.sortDirection || SortDirection.DESC;
        const modifier = direction === SortDirection.ASC ? 1 : -1;

        articles.sort((a, b) => {
            let valA: any;
            let valB: any;

            switch (sortOption) {
                case ArticleSortOption.PUBLISHED_AT:
                    valA = a.publishedAt ? a.publishedAt.getTime() : 0;
                    valB = b.publishedAt ? b.publishedAt.getTime() : 0;
                    break;
                case ArticleSortOption.READING_LEVEL:
                    valA = a.metadata.readingLevel || 0;
                    valB = b.metadata.readingLevel || 0;
                    break;
                case ArticleSortOption.PERFORMANCE_DIFFICULTY:
                    valA = a.metadata.performanceDifficulty || 0;
                    valB = b.metadata.performanceDifficulty || 0;
                    break;
                case ArticleSortOption.WORK_POPULARITY:
                    // Need numeric mapping or just compare ID string? 
                    // Taxonomy defines score_range. For now, skip complex sort in FS.
                    valA = 0; valB = 0;
                    break;
                case ArticleSortOption.TRENDING:
                    valA = a.engagement.metrics.viewCount;
                    valB = b.engagement.metrics.viewCount;
                    break;
                case ArticleSortOption.COMPOSITION_YEAR:
                    valA = a.metadata.compositionYear || 0;
                    valB = b.metadata.compositionYear || 0;
                    break;
                case ArticleSortOption.COMPOSER_BIRTH_YEAR:
                    valA = a.metadata.composerBirthYear || 0;
                    valB = b.metadata.composerBirthYear || 0;
                    break;
                case ArticleSortOption.TITLE:
                    valA = a.metadata.title;
                    valB = b.metadata.title;
                    break;
                default:
                    valA = 0; valB = 0;
            }

            if (valA < valB) return -1 * modifier;
            if (valA > valB) return 1 * modifier;
            return 0;
        });

        // Pagination
        const totalCount = articles.length;
        const offset = criteria.offset || 0;
        const limit = criteria.limit || 20;
        const pagedArticles = articles.slice(offset, offset + limit);

        return {
            items: pagedArticles,
            totalCount,
            hasNextPage: offset + limit < totalCount,
        };
    }

    /**
     * Save Article (Sync to FS)
     */
    async save(article: Article): Promise<void> {
        const category = article.category;
        const lang = article.lang;
        const slug = article.slug;

        // Ensure dir exists
        const dirPath = path.join(this.contentDirectory, lang, category);
        fs.mkdirSync(dirPath, { recursive: true });

        const filePath = path.join(dirPath, `${slug}.mdx`);

        // Construct frontmatter object
        const frontmatter = {
            ...article.metadata,
            status: article.control.status, // Move entity fields to frontmatter for persistence
        };

        const fileContent = matter.stringify(article.content.body, frontmatter);
        fs.writeFileSync(filePath, fileContent, 'utf8');
    }

    /**
     * Delete Article
     */
    async delete(id: string): Promise<void> {
        // Very tricky without slug/lang/category. 
        // Assuming findById is called first to get metadata.
        const article = await this.findById(id);
        if (article) {
            const filePath = path.join(this.contentDirectory, article.lang, article.category, `${article.slug}.mdx`);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
    }

    // --- Private Helpers ---

    private async getAllArticles(): Promise<Article[]> {
        const categories = Object.values(ArticleCategory);
        // Assuming 'ja' for now or we need to scan all langs. 
        // Usually criteria.lang provides the scope.
        // For simplicity, let's scan all langs / categories.

        // We can list `content` dirs to find langs.
        const langs = fs.readdirSync(this.contentDirectory).filter(f => fs.statSync(path.join(this.contentDirectory, f)).isDirectory());

        const allArticles: Article[] = [];

        for (const lang of langs) {
            for (const category of categories) {
                const dirPath = path.join(this.contentDirectory, lang, category as string);
                if (fs.existsSync(dirPath)) {
                    // Recursive search for MDX files
                    const files = this.getAllMdxFiles(dirPath);

                    for (const filePath of files) {
                        // Slug calculation: relative path from category dir, removing extension
                        const relativePath = path.relative(dirPath, filePath);
                        // Normalize separators and remove extension
                        const slug = relativePath.replace(/\\/g, '/').replace(/\.mdx$/, '');

                        const article = await this.parseArticleFile(filePath, lang, category as ArticleCategory, slug);
                        if (article) {
                            allArticles.push(article);
                        }
                    }
                }
            }
        }
        return allArticles;
    }

    private getAllMdxFiles(dir: string): string[] {
        let results: string[] = [];
        const list = fs.readdirSync(dir);

        list.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);
            if (stat && stat.isDirectory()) {
                results = results.concat(this.getAllMdxFiles(filePath));
            } else {
                if (file.endsWith('.mdx')) {
                    results.push(filePath);
                }
            }
        });
        return results;
    }

    private async parseArticleFile(filePath: string, lang: string, category: ArticleCategory, slug: string): Promise<Article | null> {
        try {
            const fileContents = fs.readFileSync(filePath, 'utf8');
            const { data, content } = matter(fileContents);

            // Validate Metadata
            let metadata: ArticleMetadata;

            // Inject slug and category for validation
            const dataToValidate = {
                ...data,
                slug: data.slug || slug,
                category: data.category || category,
            };

            const parseResult = ArticleMetadataSchema.safeParse(dataToValidate);
            if (parseResult.success) {
                metadata = parseResult.data;
            } else {
                // Fallback: Try to map legacy frontmatter to new schema
                // console.warn(`Legacy Frontmatter detected for ${slug}, mapping...`);
                metadata = this.mapLegacyMetadata(dataToValidate);
            }

            const status = (data.status as ArticleStatus) || ArticleStatus.PUBLISHED;
            const isFeatured = !!data.isFeatured;
            // Support both 'publishedAt' (new) and 'date' (legacy summary)
            const dateStr = data.publishedAt || data.date;
            const date = dateStr ? new Date(dateStr) : null;

            // Calculate ContentStructure (Simple Regex based TOC)
            const contentStructure = this.extractToc(content);

            // Ensure discovery fields are set in metadata
            metadata.slug = slug;
            metadata.category = category;
            metadata.isFeatured = isFeatured;
            metadata.readingTimeSeconds = data.readingTimeSeconds || 0;
            metadata.publishedAt = date;

            return new Article({
                control: {
                    id: slug, // Use slug as ID for FS
                    lang: lang as any,
                    status: status as ArticleStatus,
                    createdAt: date || new Date(),
                    updatedAt: new Date(),
                },
                metadata,
                content: {
                    body: content,
                    structure: contentStructure,
                },
                engagement: {
                    metrics: INITIAL_ENGAGEMENT_METRICS,
                },
                context: {
                    seriesAssignments: [],
                    relatedArticles: data.relatedArticles || [],
                    sourceAttributions: data.sourceAttributions || [],
                    monetizationElements: data.monetizationElements || [],
                }
            });

        } catch (e) {
            logger.warn(`Failed to parse article: ${filePath}`, { error: e });
            return null;
        }
    }

    /**
     * Legacy Frontmatter Mapping
     * 旧MDXメタデータを新ドメインに適合させる
     */
    private mapLegacyMetadata(data: any): ArticleMetadata {
        // Map Difficulty Map
        const difficultyMap: Record<string, number> = {
            'Beginner': 1,
            'Intermediate': 3,
            'Advanced': 5,
            'Professional': 5,
            'Virtuoso': 5
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
            era: undefined, // Tags might contain this
            nationality: undefined,
            key: data.key,

            readingLevel: level,
            performanceDifficulty: level, // Assume same for legacy

            slug: data.slug || 'unknown',
            category: data.category || ArticleCategory.WORKS,
            isFeatured: !!data.isFeatured,
            readingTimeSeconds: data.readingTimeSeconds || 0,

            // Media (Structured Playback)
            playback: data.audioSrc ? {
                audioSrc: data.audioSrc,
                performer: data.performer,
                startSeconds: data.startSeconds,
                endSeconds: data.endSeconds,
            } : undefined,
            thumbnail: data.thumbnail,

            tags: data.tags || [],
            publishedAt: data.date ? new Date(data.date) : null,
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
                    children: []
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
                    level: 3
                });
            }
        }
        return sections;
    }

    private slugify(text: string): string {
        // rehype-slugのデフォルト挙動に合わせる（非ASCII文字もエンコードして保持）
        return text
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\-]+/g, '');
    }
}
