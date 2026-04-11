import { describe, it, expect, beforeAll } from 'vitest';
import { WorkTitleFormatter } from './work-title-formatter.js';
import { taxonomy } from '../shared/taxonomy/TaxonomyRegistry.js';

describe('WorkTitleFormatter', () => {
  beforeAll(() => {
    taxonomy.initialize({
      genres: [
        { id: 'symphony', label: { ja: '交響曲', en: 'Symphony' } },
        { id: 'piano-sonata', label: { ja: 'ピアノソナタ', en: 'Piano Sonata' } },
      ],
      keys: [{ id: 'c-minor', label: { ja: 'ハ短調', en: 'C minor' } }],
    });
  });

  const commonCatalogues = [
    {
      prefix: 'op' as const,
      number: '67',
      isPrimary: true,
    },
  ];

  describe('format (Japanese)', () => {
    it('should format standard title (Symphony No. 5)', () => {
      const result = WorkTitleFormatter.format({
        locale: 'ja',
        genres: ['symphony'],
        key: 'c-minor',
        catalogues: commonCatalogues,
        components: {
          displayType: 'standard',
          number: 5,
          nickname: { ja: '運命', en: 'Fate' },
        },
      });
      // 交響曲 + 第5番 + ハ短調 + 「運命」 + 作品67
      expect(result).toBe('交響曲第5番 ハ短調 「運命」 作品67');
    });

    it('should format title-priority (Festive Overture)', () => {
      const result = WorkTitleFormatter.format({
        locale: 'ja',
        catalogues: [{ prefix: 'op' as const, number: '96', isPrimary: true }],
        components: {
          displayType: 'title-priority',
          distinctiveTitle: { ja: '祝典序曲', en: 'Festive Overture' },
        },
      });
      expect(result).toBe('祝典序曲 作品96');
    });

    it('should format catalogue-only', () => {
      const result = WorkTitleFormatter.format({
        locale: 'ja',
        genres: ['piano-sonata'],
        catalogues: [{ prefix: 'k' as const, number: '331', isPrimary: true }],
        components: {
          displayType: 'catalogue-only',
        },
      });
      expect(result).toBe('ピアノソナタ K. 331');
    });

    it('should return custom title when displayType is custom', () => {
      const result = WorkTitleFormatter.format({
        locale: 'ja',
        components: {
          displayType: 'custom',
          distinctiveTitle: { ja: 'カスタムタイトル', en: 'Custom Title' },
        },
      });
      expect(result).toBe('カスタムタイトル');
    });
  });

  describe('format (English)', () => {
    it('should format standard title (Symphony No. 5)', () => {
      const result = WorkTitleFormatter.format({
        locale: 'en',
        genres: ['symphony'],
        key: 'c-minor',
        catalogues: commonCatalogues,
        components: {
          displayType: 'standard',
          number: 5,
          nickname: { ja: '運命', en: 'Fate' },
        },
      });
      // Symphony + No. 5 + in C minor + "Fate" + Op. 67
      expect(result).toBe('Symphony No. 5 in C minor "Fate" Op. 67');
    });
  });
});
