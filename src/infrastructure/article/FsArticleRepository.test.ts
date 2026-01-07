import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FsArticleRepository } from './FsArticleRepository';
import { ArticleCategory } from '@/domain/article/ArticleMetadata';
import fs from 'fs';
import path from 'path';

// Mock fs
vi.mock('fs', () => ({
    default: {
        existsSync: vi.fn(),
        readFileSync: vi.fn(),
        readdirSync: vi.fn(),
        mkdirSync: vi.fn(),
        writeFileSync: vi.fn(),
        unlinkSync: vi.fn(),
        statSync: vi.fn(),
    },
    existsSync: vi.fn(),
    readFileSync: vi.fn(),
    readdirSync: vi.fn(),
    mkdirSync: vi.fn(),
    writeFileSync: vi.fn(),
    unlinkSync: vi.fn(),
    statSync: vi.fn(),
}));

describe('FsArticleRepository', () => {
    let repository: FsArticleRepository;

    // Mock valid MDX (New Schema)
    const validMdx = `---
title: "Prelude 1"
displayTitle: "Prelude 1"
composerName: "J.S. Bach"
readingLevel: 3
status: "published"
isFeatured: true
tags: ["Piano", "Baroque"]
---
## Introduction
Text body`;

    // Mock legacy MDX (Old Schema)
    const legacyMdx = `---
title: "Legacy Piece"
composer: "Mozart"
difficulty: "Advanced"
tags: ["Classical"]
audioSrc: "/audio/legacy.mp3"
---
Content`;

    beforeEach(() => {
        vi.clearAllMocks();
        repository = new FsArticleRepository();
        // Default mock behavior
        vi.mocked(fs.statSync).mockImplementation((p: any) => ({
            isDirectory: () => !p.toString().endsWith('.mdx')
        }) as any);
    });

    describe('findBySlug', () => {
        it('should return Article when file exists (New Schema)', async () => {
            // Setup mock to find file in 'works' category
            vi.mocked(fs.existsSync).mockImplementation((p) => {
                return p.toString().includes('works/prelude.mdx');
            });
            vi.mocked(fs.readFileSync).mockReturnValue(validMdx);

            const result = await repository.findBySlug('en', ArticleCategory.WORKS, 'prelude');

            expect(result).not.toBeNull();
            // expect(result?.title).toBe('Prelude 1'); // Entity uses metadata.title

            expect(result?.metadata.title).toBe('Prelude 1');
            expect(result?.metadata.composerName).toBe('J.S. Bach');
            expect(result?.metadata.readingLevel).toBe(3);
            expect(result?.isFeatured).toBe(true);
            expect(result?.category).toBe(ArticleCategory.WORKS);
        });

        it('should map Legacy Frontmatter correctly', async () => {
            // Setup mock to find file in 'works' category
            vi.mocked(fs.existsSync).mockImplementation((p) => {
                return p.toString().includes('works/legacy.mdx');
            });
            vi.mocked(fs.readFileSync).mockReturnValue(legacyMdx);

            const result = await repository.findBySlug('en', ArticleCategory.WORKS, 'legacy');

            expect(result).not.toBeNull();
            expect(result?.metadata.title).toBe('Legacy Piece');
            expect(result?.metadata.composerName).toBe('Mozart'); // Mapped from 'composer'
            expect(result?.metadata.readingLevel).toBe(5); // Mapped from 'Advanced'
            expect(result?.metadata.performanceDifficulty).toBe(5); // Mapped from 'Advanced'
            expect(result?.metadata.playback?.audioSrc).toBe('/audio/legacy.mp3');
        });

        it('should return null if file not found', async () => {
            vi.mocked(fs.existsSync).mockReturnValue(false);
            const result = await repository.findBySlug('en', ArticleCategory.WORKS, 'missing');
            expect(result).toBeNull();
        });
    });

    describe('findMany', () => {
        // To test findMany, we need to mock getAllArticles (private).
        // Or mock readdirSync to simulate directory structure.

        it('should filter articles by criteria', async () => {
            // Mock directory structure
            // content/en/works/prelude.mdx
            // content/en/composers/bach.mdx

            vi.mocked(fs.readdirSync).mockImplementation((p) => {
                const pathStr = p.toString();
                if (pathStr.endsWith('content')) return ['en'] as any; // langs
                if (pathStr.endsWith('en')) return ['works', 'composers'] as any; // categories inside lang? 
                // FsArticleRepository logic: 
                // const dirPath = path.join(this.contentDirectory, lang, category);
                // So we just need to return files when dirPath matches.
                if (pathStr.includes('works')) return ['prelude.mdx'] as any;
                if (pathStr.includes('composers')) return ['bach.mdx'] as any;
                return [] as any;
            });

            // Mock FS exist check for directories
            vi.mocked(fs.existsSync).mockReturnValue(true);

            // Mock content reading
            vi.mocked(fs.readFileSync).mockImplementation((p) => {
                if (p.toString().includes('prelude.mdx')) return validMdx;
                if (p.toString().includes('bach.mdx')) return legacyMdx; // Use legacy for variety
                return '';
            });

            const result = await repository.findMany({
                lang: 'en',
                category: ArticleCategory.WORKS
            });

            expect(result.items).toHaveLength(1);
            expect(result.items[0].slug).toBe('prelude');
        });
    });
});
