import { describe, it, expect } from 'vitest';
import { createScoreMetadata, ScoreMetadataSchema } from './ScoreMetadata';
import { ScoreFormat } from './ScoreFormat';

describe('ScoreMetadata', () => {
    it('すべてのプロパティを持つ ScoreMetadata を作成できること', () => {
        const params = {
            publisherName: 'Henle',
            editorName: 'Wallner',
            editionName: 'Urtext',
            isbn: '979-0-2018-0001-1',
            janCode: '4900000000000',
            affiliateLinks: [{ provider: 'amazon', url: 'https://amazon.com/...', label: 'Buy' }],
            pdfUrl: 'https://imslp.org/test.pdf',
            format: ScoreFormat.ABC,
        };
        const metadata = createScoreMetadata(params);

        expect(metadata).toEqual(expect.objectContaining(params));
    });

    it('不正なURLでバリデーションエラーになること', () => {
        expect(() => createScoreMetadata({ pdfUrl: 'invalid-url' })).toThrow();
    });

    it('出版社名が長すぎる場合にエラーになること', () => {
        const longName = 'a'.repeat(51);
        expect(() => createScoreMetadata({ publisherName: longName })).toThrow();
    });

    it('アフィリエイトリンクのラベルが長すぎる場合にエラーになること', () => {
        expect(() => createScoreMetadata({
            affiliateLinks: [{ provider: 'test', url: 'https://example.com', label: 'a'.repeat(21) }]
        })).toThrow();
    });

    it('デフォルトで affiliateLinks が空配列であること', () => {
        const metadata = createScoreMetadata({});
        expect(metadata.affiliateLinks).toEqual([]);
    });
});
