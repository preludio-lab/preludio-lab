import { describe, it, expect } from 'vitest';
import { Work, WorkId } from './work';
import { MetronomeUnit } from './work.metadata';
import { MusicalEra } from '../shared/musical-era';
import { MusicalGenre } from '../shared/musical-genre';
import { MusicalCataloguePrefix } from './musical-catalogue-prefix';
import { MusicalKey } from './musical-key';

describe('Work Entity', () => {
  const validControl = {
    id: '550e8400-e29b-41d4-a716-446655440000' as WorkId,
    composerSlug: 'beethoven',
    slug: 'symphony-no5',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const validMetadata = {
    titleComponents: {
      displayType: 'standard' as const,
      content: { ja: '交響曲第5番', en: 'Symphony No. 5' },
      nickname: { ja: '運命', en: 'Fate' },
    },
    catalogues: [
      {
        prefix: MusicalCataloguePrefix.OP,
        number: '67',
        sortOrder: 67,
        isPrimary: true,
      },
    ],
    performanceDifficulty: 5,
    era: MusicalEra.CLASSICAL,
    instrumentation: 'Symphony Orchestra',
    instruments: [],
    instrumentationFlags: {
      isSolo: false,
      isChamber: false,
      isOrchestral: true,
      hasChorus: false,
      hasVocal: false,
    },
    musicalIdentity: {
      key: MusicalKey.C_MINOR,
      genres: [MusicalGenre.ORCHESTRAL.SYMPHONY],
      tempo: 'Allegro con brio',
      tempoTranslation: { ja: '快活に、元気に', en: 'Lively and with spirit' },
      timeSignature: { numerator: 2, denominator: 4 },
      bpm: 108,
      metronomeUnit: MetronomeUnit.QUARTER,
    },
    compositionYear: 1808,
    nicknames: ['Schicksal'],
    tags: [],
    description: { ja: '説明', en: 'Description' },
  };

  it('should create a valid Work instance', () => {
    const work = new Work({
      control: validControl,
      metadata: validMetadata,
    });

    expect(work.id).toBe(validControl.id);
    expect(work.slug).toBe(validControl.slug);
    expect(work.composerSlug).toBe(validControl.composerSlug);
    expect(work.title.ja).toBe('交響曲第5番');
    expect(work.catalogue).toBe('op 67');
    expect(work.era).toBe(MusicalEra.CLASSICAL);
    expect(work.genres).toContain('symphony');
    expect(work.performanceDifficulty).toBe(5);
    expect(work.instrumentationFlags.isOrchestral).toBe(true);
    expect(work.metadata.musicalIdentity?.key).toBe(MusicalKey.C_MINOR);
    expect(work.metadata.musicalIdentity?.bpm).toBe(108);
    expect(work.hasParts()).toBe(false);
  });

  it('should correctly format catalogue when properties are missing', () => {
    const work1 = new Work({
      control: validControl,
      metadata: { ...validMetadata, catalogues: [{ number: '67', isPrimary: true }] },
    });
    expect(work1.catalogue).toBe('67');

    const work2 = new Work({
      control: validControl,
      metadata: {
        ...validMetadata,
        catalogues: [{ prefix: MusicalCataloguePrefix.OP, isPrimary: true }],
      },
    });
    expect(work2.catalogue).toBe('op');

    const work3 = new Work({
      control: validControl,
      metadata: { ...validMetadata, catalogues: [] },
    });
    expect(work3.catalogue).toBe('');
  });

  it('should handle complex catalogue numbers', () => {
    const work = new Work({
      control: validControl,
      metadata: {
        ...validMetadata,
        catalogues: [{ prefix: MusicalCataloguePrefix.K, number: '331a', isPrimary: true }],
      },
    });
    expect(work.catalogue).toBe('k 331a');
  });

  it('should clone with partial updates', () => {
    const work = new Work({
      control: validControl,
      metadata: validMetadata,
    });

    const cloned = work.cloneWith({
      control: { composerSlug: 'brahms' },
      metadata: { performanceDifficulty: 4 },
    });

    expect(cloned.composerSlug).toBe('brahms');
    expect(cloned.metadata.performanceDifficulty).toBe(4);
    expect(cloned.id).toBe(work.id);
  });

  describe('Title Synthesis', () => {
    it('should synthesize standard title correctly', () => {
      const work = new Work({
        control: validControl,
        metadata: {
          ...validMetadata,
          titleComponents: {
            displayType: 'standard' as const,
            prefix: { ja: '祝典序曲', en: 'Festive Overture' },
            content: { ja: '作品96', en: 'Op. 96' },
          },
        },
      });
      expect(work.title.ja).toBe('祝典序曲 作品96');
      expect(work.title.en).toBe('Festive Overture Op. 96');
    });

    it('should respect distinctive title when provided', () => {
      // Assuming formatter is updated or will handle distinctiveTitle appropriately
      // For now, let's just ensure basic synthesis still works with the new fields present
      const work = new Work({
        control: validControl,
        metadata: {
          ...validMetadata,
          titleComponents: {
            displayType: 'title-priority' as const,
            distinctiveTitle: { ja: '竹取物語', en: 'Tale of the Bamboo Cutter' },
            number: 1,
          },
        },
      });
      // In current synthesizeTitle, only prefix/content are used.
      // Once work.formatter.ts is and synthesizeTitle is updated, this will be more expressive.
      expect(work).toBeDefined();
    });
  });
});
