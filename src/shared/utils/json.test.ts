import { describe, it, expect } from 'vitest';
import { prune, deepMergeTranslation } from './json.js';

describe('prune', () => {
  it('should remove empty strings and magic words', () => {
    const input = {
      name: 'Beethoven',
      title: '',
      nickname: 'none',
      period: 'なし',
      notes: 'null',
      details: {
        tempo: 'undefined',
        bpm: '[object object]',
        type: 'symphony',
      },
      tags: [],
    };
    const expected = {
      name: 'Beethoven',
      details: {
        type: 'symphony',
      },
    };
    expect(prune(input)).toEqual(expected);
  });

  it('should remove null and undefined values', () => {
    const input = {
      a: null,
      b: undefined,
      c: {
        d: null,
        e: 1,
      },
    };
    const expected = {
      c: {
        e: 1,
      },
    };
    expect(prune(input)).toEqual(expected);
  });

  it('should remove empty objects and arrays recursively', () => {
    const input = {
      emptyObj: {},
      emptyArr: [],
      nestedEmpty: {
        a: {},
        b: [],
      },
      valid: 1,
    };
    const expected = {
      valid: 1,
    };
    expect(prune(input)).toEqual(expected);
  });
});

describe('deepMergeTranslation', () => {
  it('should merge translation into { ja: ... } objects', () => {
    const base = {
      title: { ja: '運命' },
      description: { ja: 'ジャジャジャジャーン' },
      info: {
        author: 'Beethoven',
      },
    };
    const translation = {
      title: 'Fate',
      description: 'Dun dun dun dunnnn',
      info: 'ignored', // normal string on non-multilingual field
    };
    const expected = {
      title: { ja: '運命', en: 'Fate' },
      description: { ja: 'ジャジャジャジャーン', en: 'Dun dun dun dunnnn' },
      info: {
        author: 'Beethoven',
      },
    };
    expect(deepMergeTranslation(base, translation, 'en')).toEqual(expected);
  });

  it('should handle nested multilingual objects', () => {
    const base = {
      components: {
        prefix: { ja: '交響曲' },
        content: { ja: '第5番' },
      },
    };
    const translation = {
      components: {
        prefix: 'Symphony',
        content: 'No. 5',
      },
    };
    const expected = {
      components: {
        prefix: { ja: '交響曲', en: 'Symphony' },
        content: { ja: '第5番', en: 'No. 5' },
      },
    };
    expect(deepMergeTranslation(base, translation, 'en')).toEqual(expected);
  });

  it('should guard against [object Object] and magic words in translation', () => {
    const base = {
      title: { ja: 'タイトル' },
    };
    const translation = {
      title: '[object Object]',
    };
    expect(deepMergeTranslation(base, translation, 'en')).toEqual(base);
  });
});
