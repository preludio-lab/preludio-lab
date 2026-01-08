import { describe, it, expect } from 'vitest';
import { createMusicalExampleMetadata } from './MusicalExampleMetadata';
import { ScoreFormat } from './ScoreFormat';

describe('MusicalExampleMetadata', () => {
    it('必須フィールドを持つ MusicalExampleMetadata を作成できること', () => {
        const params = {
            workId: 'work-1',
            slug: '1st-theme',
            format: ScoreFormat.ABC,
            data: 'X:1\nK:C\nCDEFGABc',
        };
        const metadata = createMusicalExampleMetadata(params);

        expect(metadata.workId).toBe(params.workId);
        expect(metadata.slug).toBe(params.slug);
        expect(metadata.format).toBe(params.format);
        expect(metadata.data).toBe(params.data);
    });
});
