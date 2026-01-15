import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { ArticleCategory, ArticleMetadata, ArticleMetadataSchema } from '@/domain/article/ArticleMetadata';
import { ArticleStatus } from '@/domain/article/ArticleControl';
import { logger } from '@/infrastructure/logging';

export interface FsArticleContext {
    id: string; // slug for FS
    slug: string;
    lang: string;
    category: ArticleCategory;
    status: ArticleStatus;
    filePath: string;
    metadata: ArticleMetadata;
    createdAt: Date;
    updatedAt: Date;
}

export class FsArticleMetadataDataSource {
    private readonly contentDirectory: string;

    constructor(contentDir?: string) {
        this.contentDirectory = contentDir || path.join(process.cwd(), 'article');
    }

    async findBySlug(lang: string, category: ArticleCategory, slug: string): Promise<FsArticleContext | null> {
        const filePath = path.join(this.contentDirectory, lang, category, `${slug}.mdx`);
        if (fs.existsSync(filePath)) {
            return this.parseMetadata(filePath, lang, category, slug);
        }
        return null;
    }

    async findAll(): Promise<FsArticleContext[]> {
        const categories = Object.values(ArticleCategory);
        // Listing logic adapted from FsArticleRepository
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
                        const context = await this.parseMetadata(filePath, lang, category as ArticleCategory, slug);
                        if (context) results.push(context);
                    }
                }
            }
        }
        return results;
    }

    // --- Helpers ---

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
            const { data } = matter(fileContents);

            // Validation & Mapping Logic duplicating FsArticleRepository
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

            // Ensure critical fields
            metadata.slug = slug;
            metadata.category = category;
            const isFeatured = !!data.isFeatured;
            metadata.isFeatured = isFeatured;
            metadata.readingTimeSeconds = data.readingTimeSeconds || 0;

            const dateStr = data.publishedAt || data.date;
            const date = dateStr ? new Date(dateStr) : null;
            metadata.publishedAt = date;

            const status = (data.status as ArticleStatus) || ArticleStatus.PUBLISHED;

            return {
                id: slug,
                slug,
                lang,
                category,
                status,
                filePath,
                metadata,
                createdAt: date || new Date(),
                updatedAt: fs.statSync(filePath).mtime,
            };
        } catch (e) {
            logger.warn(`Failed to parse metadata: ${filePath}`, { error: e });
            return null;
        }
    }

    private mapLegacyMetadata(data: any): ArticleMetadata {
        // Copying logic from FsArticleRepository
        const difficultyMap: Record<string, number> = {
            Beginner: 1, Intermediate: 3, Advanced: 5, Professional: 5, Virtuoso: 5,
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
            playback: data.audioSrc ? {
                audioSrc: data.audioSrc, performer: data.performer, startSeconds: data.startSeconds, endSeconds: data.endSeconds
            } : undefined,
            thumbnail: data.thumbnail,
            tags: data.tags || [],
            publishedAt: data.date ? new Date(data.date) : null,
        };
    }
}
