import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { ContentDetail, ContentSummary, MetadataSchema } from '@/domain/content/Content';
import { IContentRepository, ContentFilterCriteria } from '@/domain/content/ContentRepository';
import { SUPPORTED_CATEGORIES, ContentSortOption } from '@/domain/content/ContentConstants';
import { ILogger } from '@/domain/shared/logger';
import { PinoLogger } from '@/infrastructure/logging/pino-logger';

/**
 * ファイルシステム（FS）ベースのコンテンツリポジトリ実装
 * content フォルダ配下の MDX ファイルを読み込み、ドメインオブジェクトに変換する
 */
export class FsContentRepository implements IContentRepository {
    private readonly contentDirectory: string;
    private readonly logger: ILogger;

    constructor() {
        this.contentDirectory = path.join(process.cwd(), 'content');
        this.logger = new PinoLogger();
    }

    /**
     * 指定された言語、カテゴリ、スラグから単一のコンテンツ詳細を取得する
     */
    async getContentDetailBySlug(lang: string, category: string, slug: string[]): Promise<ContentDetail | null> {
        const slugPath = slug.join('/');
        const fullPath = path.join(this.contentDirectory, lang, category, `${slugPath}.mdx`);

        try {
            if (!fs.existsSync(fullPath)) {
                this.logger.warn(`File not found: ${fullPath}`, { context: 'FsContentRepository' });
                return null;
            }

            const fileContents = fs.readFileSync(fullPath, 'utf8');
            const { data, content } = matter(fileContents);

            // メタデータのバリデーション（Zodスキーマを使用）
            const metadata = MetadataSchema.parse(data);

            return {
                slug: slugPath,
                lang,
                category,
                metadata,
                body: content,
            };
        } catch (error) {
            this.logger.error(`Markdownファイルの読み込みエラー: ${fullPath}`, error as Error, { context: 'FsContentRepository' });
            return null;
        }
    }

    /**
     * 指定された条件に基づいてコンテンツ概要一覧を取得する
     * ファイルシステム上のMDXファイルを全件読み込んだ後、メモリ上でフィルタリング・ソートを行う。
     */
    async findSummariesByCriteria(criteria: ContentFilterCriteria): Promise<ContentSummary[]> {
        const { lang, category, difficulty, tags, keyword, sort } = criteria;

        // 全件取得
        let summaries = await this.getContentSummariesByCategory(lang, category);

        // 1. フィルタリング (難易度)
        if (difficulty) {
            summaries = summaries.filter(s => s.metadata.difficulty === difficulty);
        }

        // 2. フィルタリング (タグ - AND一致)
        if (tags && tags.length > 0) {
            summaries = summaries.filter(s =>
                tags.every((tag: string) => s.metadata.tags?.includes(tag))
            );
        }

        // 3. フィルタリング (キーワード - タイトルまたはタグ)
        if (keyword) {
            const lowKeyword = keyword.toLowerCase();
            summaries = summaries.filter(s =>
                s.metadata.title.toLowerCase().includes(lowKeyword) ||
                s.metadata.tags?.some((tag: string) => tag.toLowerCase().includes(lowKeyword))
            );
        }

        // 4. ソーティング
        summaries.sort((a, b) => {
            switch (sort) {
                case ContentSortOption.OLDEST: {
                    const dateA = a.metadata.date ? new Date(a.metadata.date).getTime() : Infinity;
                    const dateB = b.metadata.date ? new Date(b.metadata.date).getTime() : Infinity;
                    return dateA - dateB;
                }
                case ContentSortOption.TITLE:
                    return a.metadata.title.localeCompare(b.metadata.title, lang);
                case ContentSortOption.DIFFICULTY_ASC: {
                    const diffOrder: Record<string, number> = { 'Beginner': 0, 'Intermediate': 1, 'Advanced': 2 };
                    const valA = diffOrder[a.metadata.difficulty || ''] ?? 99;
                    const valB = diffOrder[b.metadata.difficulty || ''] ?? 99;
                    return valA - valB;
                }
                case ContentSortOption.DIFFICULTY_DESC: {
                    const diffOrder: Record<string, number> = { 'Beginner': 0, 'Intermediate': 1, 'Advanced': 2 };
                    const valA = diffOrder[a.metadata.difficulty || ''] ?? -1;
                    const valB = diffOrder[b.metadata.difficulty || ''] ?? -1;
                    return valB - valA;
                }
                case ContentSortOption.LATEST:
                default: {
                    const dateA = a.metadata.date ? new Date(a.metadata.date).getTime() : 0;
                    const dateB = b.metadata.date ? new Date(b.metadata.date).getTime() : 0;
                    return dateB - dateA;
                }
            }
        });

        return summaries;
    }


    /**
     * 指定されたカテゴリの全コンテンツ概要（本文なし）を取得する
     * ※一覧表示や軽量なデータアクセスに使用する
     */
    async getContentSummariesByCategory(lang: string, category: string): Promise<ContentSummary[]> {
        const categoryPath = path.join(this.contentDirectory, lang, category);
        const files = this.getMdxFiles(categoryPath);

        const contents = files.map((filePath) => {
            const fileContents = fs.readFileSync(filePath, 'utf8');
            // gray-matterでパース。概要一覧では本文（content）を保持しないことで
            // メモリ消費を抑える。
            const { data } = matter(fileContents);

            // カテゴリルートからの相対パスに基づいてスラグを算出
            const relativePath = path.relative(categoryPath, filePath);
            const slug = relativePath.replace(/\.mdx$/, '');

            try {
                const metadata = MetadataSchema.parse(data);
                return {
                    slug,
                    lang,
                    category,
                    metadata,
                };
            } catch (e) {
                this.logger.warn(`メタデータのパースエラー (${filePath}):`, { context: 'FsContentRepository', error: e });
                return null;
            }
        })
            .filter((content): content is ContentSummary => content !== null);

        return contents;
    }

    async getLatestContentSummariesByCategory(lang: string, category: string, limit: number): Promise<ContentSummary[]> {
        // 全件取得してからソート・制限を行う（FS実装としてはこれで十分。DB実装時にSQLで最適化される）
        const allSummaries = await this.getContentSummariesByCategory(lang, category);

        return allSummaries
            .sort((a, b) => {
                const dateA = a.metadata.date ? new Date(a.metadata.date).getTime() : 0;
                const dateB = b.metadata.date ? new Date(b.metadata.date).getTime() : 0;
                return dateB - dateA;
            })
            .slice(0, limit);
    }

    async getLatestContentSummaries(lang: string, limit: number): Promise<ContentSummary[]> {
        // 全カテゴリから、必要な件数分だけ最新記事を取得する
        // インフラ層でループ処理を行うことで、アプリ層は「全件取得」の手段を意識しなくて済む
        const allContentsPromises = SUPPORTED_CATEGORIES.map(async (category) => {
            return this.getLatestContentSummariesByCategory(lang, category, limit);
        });

        const nestedResults = await Promise.all(allContentsPromises);
        const allContents = nestedResults.flat();

        if (allContents.length === 0) {
            return [];
        }

        const sorted = allContents.sort((a, b) => {
            const dateA = a.metadata.date ? new Date(a.metadata.date).getTime() : 0;
            const dateB = b.metadata.date ? new Date(b.metadata.date).getTime() : 0;
            return dateB - dateA;
        });

        return sorted.slice(0, limit);
    }

    /**
     * 指定されたディレクトリから、再帰的にすべての .mdx ファイルのパスを取得する
     */
    private getMdxFiles(dir: string): string[] {
        if (!fs.existsSync(dir)) {
            return [];
        }
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        const files = entries.map((entry) => {
            const res = path.resolve(dir, entry.name);
            return entry.isDirectory() ? this.getMdxFiles(res) : res;
        });
        return Array.prototype.concat(...files).filter((file: string) => file.endsWith('.mdx'));
    }
}
