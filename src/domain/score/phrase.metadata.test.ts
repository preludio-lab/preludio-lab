import { describe, it, expect } from 'vitest';
import { PhraseMetadataSchema } from './phrase.metadata';

describe('PhraseMetadata', () => {
  const validParams = {
    workSlug: 'symphony-no-5',
    slug: '1st-theme',
    format: 'abc',
    notationPath: 'scores/beethoven/sym5-theme1.abc',
    caption: { ja: '第1主題' },
  };

  it('必須フィールドを持つ PhraseMetadata を作成できること', () => {
    const metadata = PhraseMetadataSchema.parse(validParams);
    expect(metadata.workSlug).toBe(validParams.workSlug);
    expect(metadata.format).toBe(validParams.format);
  });

  it('slugの形式が不正な場合にエラーになること', () => {
    expect(() => PhraseMetadataSchema.parse({ ...validParams, slug: 'Invalid Slug' })).toThrow();
  });

  it('notationPath が空の場合にエラーになること', () => {
    expect(() => PhraseMetadataSchema.parse({ ...validParams, notationPath: '' })).toThrow();
  });

  it('多言語の caption を持つ PhraseMetadata を作成できること', () => {
    const metadata = PhraseMetadataSchema.parse({
      ...validParams,
      caption: { ja: '第1主題', en: '1st Theme' },
    });
    expect(metadata.caption?.ja).toBe('第1主題');
  });

  it('caption が最大文字数を超える場合にエラーになること', () => {
    const longCaption = 'a'.repeat(51);
    expect(() =>
      PhraseMetadataSchema.parse({
        ...validParams,
        caption: { ja: longCaption },
      }),
    ).toThrow();
  });
});
