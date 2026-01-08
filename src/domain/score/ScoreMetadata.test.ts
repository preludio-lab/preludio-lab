import { describe, it, expect } from 'vitest';
import { ScoreMetadataSchema } from './ScoreMetadata';
import { ScoreFormat } from './ScoreMetadata';

describe('ScoreMetadata', () => {
    it('すべてのプロパティを持つ ScoreMetadata を作成できること', () => {
        const params = {
            publisherName: { en: 'Henle', ja: 'ヘンレ' },
            editorName: { en: 'Wallner' },
            editionName: { ja: '原典版' },
            isbn: '979-0-2018-0001-1',
            gtin: '4900000000000',
            affiliateLinks: [{ provider: 'amazon', url: 'https://amazon.com/...', label: 'Buy' }],
            pdfUrl: 'https://imslp.org/test.pdf',
            format: ScoreFormat.ABC,
        };
        const metadata = ScoreMetadataSchema.parse(params);

        expect(metadata).toEqual(expect.objectContaining(params));
    });

    it('不正な形式でエラーになること', () => {
        expect(() => ScoreMetadataSchema.parse({ pdfUrl: 'invalid' })).toThrow();
    });
});
