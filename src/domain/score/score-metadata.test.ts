import { describe, it, expect } from 'vitest';
import { ScoreMetadataSchema } from './score-metadata';
import { ScoreFormat } from './score-metadata';

describe('ScoreMetadata', () => {
  it('すべてのプロパティを持つ ScoreMetadata を作成できること', () => {
    const params = {
      publisher: { en: 'Henle', ja: 'ヘンレ' },
      editor: { en: 'Wallner' },
      edition: { ja: '原典版' },
      isbn: '979-0-2018-0001-1',
      gtin: '4900000000000',
      monetizationElements: [
        {
          type: 'affiliate',
          category: 'score_physical',
          title: { ja: '交響曲第5番', en: 'Symphony No.5' },
          action: 'buy',
          provider: 'amazon',
          url: 'https://amazon.com/...',
        },
      ],
      previewUrl: 'https://imslp.org/test.pdf',
      format: ScoreFormat.PHYSICAL,
    };
    const metadata = ScoreMetadataSchema.parse(params);

    expect(metadata).toEqual(expect.objectContaining(params));
  });

  it('多言語文字列が20文字を超える場合にエラーになること', () => {
    const longName = 'a'.repeat(21);
    expect(() =>
      ScoreMetadataSchema.parse({
        publisher: { en: longName },
      }),
    ).toThrow();
  });

  it('不正な形式でエラーになること', () => {
    expect(() => ScoreMetadataSchema.parse({ previewUrl: 'invalid' })).toThrow();
  });
});
