/**
 * 楽曲タイトル合成用の多言語ラベル定義
 */
export const TITLE_SYNTHESIS_LABELS = {
  ja: {
    numberPrefix: '第',
    numberSuffix: '番',
    opusPrefix: '作品',
    keyPrefix: '', // ハ短調
    nicknamePrefix: '「',
    nicknameSuffix: '」',
  },
  en: {
    numberPrefix: 'No. ',
    numberSuffix: '',
    opusPrefix: 'Op. ',
    keyPrefix: 'in ', // in C minor
    nicknamePrefix: '"',
    nicknameSuffix: '"',
  },
  de: {
    numberPrefix: 'Nr. ',
    numberSuffix: '',
    opusPrefix: 'op. ',
    keyPrefix: 'in ',
    nicknamePrefix: '»',
    nicknameSuffix: '«',
  },
  fr: {
    numberPrefix: 'n° ',
    numberSuffix: '',
    opusPrefix: 'op. ',
    keyPrefix: 'en ',
    nicknamePrefix: '« ',
    nicknameSuffix: ' »',
  },
  it: {
    numberPrefix: 'n. ',
    numberSuffix: '',
    opusPrefix: 'op. ',
    keyPrefix: 'in ',
    nicknamePrefix: '« ',
    nicknameSuffix: ' »',
  },
  es: {
    numberPrefix: 'n.º ',
    numberSuffix: '',
    opusPrefix: 'op. ',
    keyPrefix: 'en ',
    nicknamePrefix: '« ',
    nicknameSuffix: ' »',
  },
  zh: {
    numberPrefix: '第',
    numberSuffix: '号',
    opusPrefix: '作品',
    keyPrefix: '',
    nicknamePrefix: '“',
    nicknameSuffix: '”',
  },
} as const;

export type SupportedLang = keyof typeof TITLE_SYNTHESIS_LABELS;
