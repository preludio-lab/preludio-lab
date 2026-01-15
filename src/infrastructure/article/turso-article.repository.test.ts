import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TursoArticleRepository } from './turso-article.repository';
import { ArticleMetadataDataSource } from './turso-article-metadata.ds';
import { ArticleContentDataSource } from './r2-article-content.ds';
import { ArticleCategory } from '@/domain/article/ArticleMetadata';
import { Logger } from '@/shared/logging/logger';
import { AppError } from '@/domain/shared/AppError';

describe('TursoArticleRepository', () => {
    let repo: TursoArticleRepository;

    const mockMetadataDS = {
        findBySlug: vi.fn(),
        findById: vi.fn(),
    };

    const mockContentDS = {
        getContent: vi.fn(),
    };

    const mockLogger = {
        debug: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
        error: vi.fn(),
    };

    beforeEach(() => {
        repo = new TursoArticleRepository(
            mockMetadataDS as unknown as ArticleMetadataDataSource,
            mockContentDS as unknown as ArticleContentDataSource,
            mockLogger as unknown as Logger,
        );
        vi.clearAllMocks();
    });

    it('findBySlug should return Article when metadata and content are found', async () => {
        // Metadata モックの設定
        const mockRow = {
            articles: {
                id: '1',
                slug: 'slug',
                isFeatured: false,
                createdAt: '2023-01-01',
            },
            article_translations: {
                articleId: '1',
                lang: 'en',
                status: 'PUBLISHED',
                title: 'Title',
                updatedAt: '2023-01-01',
                metadata: { category: 'works' },
                mdxPath: 'path/to/content.mdx',
            },
        };
        mockMetadataDS.findBySlug.mockResolvedValue(mockRow);

        // Content モックの設定
        mockContentDS.getContent.mockResolvedValue('# Hello');

        const result = await repo.findBySlug('en', ArticleCategory.WORKS, 'slug');

        expect(result).not.toBeNull();
        expect(result?.metadata.title).toBe('Title');
        expect(result?.content.body).toBe('# Hello');

        expect(mockMetadataDS.findBySlug).toHaveBeenCalledWith('slug', 'en');
        expect(mockContentDS.getContent).toHaveBeenCalledWith('path/to/content.mdx');
    });

    it('findBySlug should throw AppError(NOT_FOUND) if metadata not found', async () => {
        mockMetadataDS.findBySlug.mockResolvedValue(null);

        // 警告ログを出力し、AppError をスローすることを確認
        await expect(repo.findBySlug('en', ArticleCategory.WORKS, 'slug')).rejects.toThrow();

        try {
            await repo.findBySlug('en', ArticleCategory.WORKS, 'slug');
        } catch (e) {
            expect((e as AppError).code).toBe('NOT_FOUND');
        }

        expect(mockLogger.warn).toHaveBeenCalled();
        expect(mockContentDS.getContent).not.toHaveBeenCalled();
    });

    it('findBySlug should return Article with empty content if mdxPath missing', async () => {
        const mockRow = {
            articles: { id: '1', slug: 'slug', createdAt: '2023-01-01' },
            article_translations: {
                articleId: '1',
                lang: 'en',
                title: 'Title',
                updatedAt: '2023-01-01',
                metadata: { category: 'works' },
                mdxPath: null, // パスなし
            },
        };
        mockMetadataDS.findBySlug.mockResolvedValue(mockRow);

        const result = await repo.findBySlug('en', ArticleCategory.WORKS, 'slug');

        expect(result).not.toBeNull();
        expect(result?.content.body).toBe('');
        expect(mockContentDS.getContent).not.toHaveBeenCalled();
    });
});
