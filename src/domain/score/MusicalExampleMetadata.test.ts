import { describe, it, expect } from 'vitest';
import { createMusicalExampleMetadata } from './MusicalExampleMetadata';
import { ScoreFormat } from './ScoreFormat';

describe('MusicalExampleMetadata', () => {
    const validParams = {
        workId: 'work-1',
        slug: '1st-theme',
        format: ScoreFormat.ABC,
        data: 'X:1\nK:C\nCDEFGABc',
    };

    it('必須フィールドを持つ MusicalExampleMetadata を作成できること', () => {
        const metadata = createMusicalExampleMetadata(validParams);
        expect(metadata.workId).toBe(validParams.workId);
        expect(metadata.format).toBe(validParams.format);
    });

    it('slugの形式が不正な場合にエラーになること', () => {
        expect(() => createMusicalExampleMetadata({ ...validParams, slug: 'Invalid Slug' })).toThrow();
    });

    it('データが空の場合にエラーになること', () => {
        expect(() => createMusicalExampleMetadata({ ...validParams, data: '' })).toThrow();
    });

    it('小節範囲のラベルが長すぎる場合にエラーになること', () => {
        expect(() => createMusicalExampleMetadata({
            ...validParams,
            measureRange: { startBar: 1, endBar: 8, label: 'a'.repeat(21) }
        })).toThrow();
    });
});
