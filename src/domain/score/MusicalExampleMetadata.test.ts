import { describe, it, expect } from 'vitest';
import { MusicalExampleMetadataSchema } from './MusicalExampleMetadata';
import { ScoreFormat } from './ScoreMetadata';

describe('MusicalExampleMetadata', () => {
    const validParams = {
        workId: 'work-1',
        slug: '1st-theme',
        format: ScoreFormat.ABC,
        notationPath: 'scores/beethoven/sym5-theme1.abc',
        visualPath: 'scores/beethoven/sym5-theme1.svg',
    };

    it('必須フィールドを持つ MusicalExampleMetadata を作成できること', () => {
        const metadata = MusicalExampleMetadataSchema.parse(validParams);
        expect(metadata.workId).toBe(validParams.workId);
        expect(metadata.format).toBe(validParams.format);
    });

    it('slugの形式が不正な場合にエラーになること', () => {
        expect(() => MusicalExampleMetadataSchema.parse({ ...validParams, slug: 'Invalid Slug' })).toThrow();
    });

    it('notationPath が空の場合にエラーになること', () => {
        expect(() => MusicalExampleMetadataSchema.parse({ ...validParams, notationPath: '' })).toThrow();
    });

    it('多言語の caption を持つ MusicalExampleMetadata を作成できること', () => {
        const metadata = MusicalExampleMetadataSchema.parse({
            ...validParams,
            caption: { ja: '第1主題', en: '1st Theme' }
        });
        expect(metadata.caption?.ja).toBe('第1主題');
    });

    it('小節範囲のラベルが長すぎる場合にエラーになること', () => {
        expect(() => MusicalExampleMetadataSchema.parse({
            ...validParams,
            measureRange: { startBar: 1, endBar: 8, label: 'a'.repeat(21) }
        })).toThrow();
    });

    it('caption が最大文字数を超える場合にエラーになること', () => {
        const longCaption = 'a'.repeat(31);
        expect(() => MusicalExampleMetadataSchema.parse({
            ...validParams,
            caption: { ja: longCaption }
        })).toThrow();
    });
});
