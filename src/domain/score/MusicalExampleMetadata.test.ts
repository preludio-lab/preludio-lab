import { describe, it, expect } from 'vitest';
import { MusicalExampleMetadataSchema } from './MusicalExampleMetadata';
import { ScoreFormat } from './ScoreMetadata';

describe('MusicalExampleMetadata', () => {
    const validParams = {
        workId: 'work-1',
        slug: '1st-theme',
        format: ScoreFormat.ABC,
        data: 'X:1\nK:C\nCDEFGABc',
    };

    it('必須フィールドを持つ MusicalExampleMetadata を作成できること', () => {
        const metadata = MusicalExampleMetadataSchema.parse(validParams);
        expect(metadata.workId).toBe(validParams.workId);
        expect(metadata.format).toBe(validParams.format);
    });

    it('slugの形式が不正な場合にエラーになること', () => {
        expect(() => MusicalExampleMetadataSchema.parse({ ...validParams, slug: 'Invalid Slug' })).toThrow();
    });

    it('データが空の場合にエラーになること', () => {
        expect(() => MusicalExampleMetadataSchema.parse({ ...validParams, data: '' })).toThrow();
    });

    it('小節範囲のラベルが長すぎる場合にエラーになること', () => {
        expect(() => MusicalExampleMetadataSchema.parse({
            ...validParams,
            measureRange: { startBar: 1, endBar: 8, label: 'a'.repeat(21) }
        })).toThrow();
    });
});
