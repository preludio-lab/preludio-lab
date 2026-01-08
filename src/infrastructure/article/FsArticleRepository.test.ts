import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FsArticleRepository } from './FsArticleRepository';
import { ArticleCategory } from '@/domain/article/ArticleMetadata';
import fs from 'fs';
import path from 'path';

// fs のモック
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

    // 有効な MDX のモック (新スキーマ)
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

    // レガシーな MDX のモック (旧スキーマ)
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
        // デフォルトのモック挙動
        vi.mocked(fs.statSync).mockImplementation((p: any) => ({
            isDirectory: () => !p.toString().endsWith('.mdx')
        }) as any);
    });

    describe('findBySlug', () => {
        it('ファイルが存在する場合に記事を返すこと (新スキーマ)', async () => {
            // 'works' カテゴリにファイルが存在するようにモックを設定
            vi.mocked(fs.existsSync).mockImplementation((p) => {
                return p.toString().includes('works/prelude.mdx');
            });
            vi.mocked(fs.readFileSync).mockReturnValue(validMdx);

            const result = await repository.findBySlug('en', ArticleCategory.WORKS, 'prelude');

            expect(result).not.toBeNull();
            // expect(result?.title).toBe('Prelude 1'); // Entity は metadata.title を使用

            expect(result?.metadata.title).toBe('Prelude 1');
            expect(result?.metadata.composerName).toBe('J.S. Bach');
            expect(result?.metadata.readingLevel).toBe(3);
            expect(result?.isFeatured).toBe(true);
            expect(result?.category).toBe(ArticleCategory.WORKS);
        });

        it('レガシーなフロントマターを正しくマッピングすること', async () => {
            // 'works' カテゴリにファイルが存在するようにモックを設定
            vi.mocked(fs.existsSync).mockImplementation((p) => {
                return p.toString().includes('works/legacy.mdx');
            });
            vi.mocked(fs.readFileSync).mockReturnValue(legacyMdx);

            const result = await repository.findBySlug('en', ArticleCategory.WORKS, 'legacy');

            expect(result).not.toBeNull();
            expect(result?.metadata.title).toBe('Legacy Piece');
            expect(result?.metadata.composerName).toBe('Mozart'); // 'composer' からマッピング
            expect(result?.metadata.readingLevel).toBe(5); // Mapped from 'Advanced'
            expect(result?.metadata.performanceDifficulty).toBe(5); // 'Advanced' からマッピング
            expect(result?.metadata.playback?.audioSrc).toBe('/audio/legacy.mp3');
        });

        it('ファイルが見つからない場合に null を返すこと', async () => {
            vi.mocked(fs.existsSync).mockReturnValue(false);
            const result = await repository.findBySlug('en', ArticleCategory.WORKS, 'missing');
            expect(result).toBeNull();
        });
    });

    describe('findMany', () => {
        // findMany をテストするために getAllArticles (private) をモック。
        // または readdirSync をモックしてディレクトリ構造をシミュレート。

        it('条件に従って記事をフィルタリングすること', async () => {
            // ディレクトリ構造をモック
            vi.mocked(fs.readdirSync).mockImplementation((p) => {
                const pathStr = p.toString();
                // pathStr will be relative to process.cwd() or absolute
                if (pathStr.endsWith('article')) return ['en'] as any;
                if (pathStr.includes('en') && !pathStr.includes('works') && !pathStr.includes('composers')) return ['works', 'composers'] as any;
                if (pathStr.includes('works')) return ['prelude.mdx'] as any;
                if (pathStr.includes('composers')) return ['bach.mdx'] as any;
                return [] as any;
            });

            // ディレクトリの存在チェックをモック
            vi.mocked(fs.existsSync).mockReturnValue(true);

            // コンテンツ読み込みをモック
            vi.mocked(fs.readFileSync).mockImplementation((p) => {
                if (p.toString().includes('prelude.mdx')) return validMdx;
                if (p.toString().includes('bach.mdx')) return legacyMdx;
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
