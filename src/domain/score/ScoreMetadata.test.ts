import { describe, it, expect } from 'vitest';
import { createScoreMetadata } from './ScoreMetadata';

describe('ScoreMetadata', () => {
    it('should create ScoreMetadata with all properties', () => {
        const params = {
            publisherName: 'Henle',
            editorName: 'Wallner',
            editionName: 'Urtext',
            isbn: '979-0-2018-0001-1',
            janCode: '4900000000000',
            affiliateLinks: [{ provider: 'amazon', url: 'https://amazon.com/...' }],
            pdfUrl: 'https://imslp.org/...',
        };
        const metadata = createScoreMetadata(params);

        expect(metadata).toEqual(expect.objectContaining(params));
    });

    it('should have empty affiliateLinks by default', () => {
        const metadata = createScoreMetadata({});
        expect(metadata.affiliateLinks).toEqual([]);
    });
});
