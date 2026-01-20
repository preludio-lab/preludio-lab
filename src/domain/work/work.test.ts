import { describe, it, expect } from 'vitest';
import { Work } from './work';
import { MetronomeUnit } from './work.metadata';
import { MusicalEra } from '../shared/musical-era';
import { MusicalGenre } from '../shared/musical-genre';
import { MusicalCataloguePrefix } from './musical-catalogue-prefix';
import { MusicalKey } from './musical-key';

describe('Work Entity', () => {
  const validControl = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    composerSlug: 'beethoven',
    slug: 'symphony-no5',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const validMetadata = {
    title: { ja: '交響曲第5番', en: 'Symphony No. 5' },
    popularTitle: { ja: '運命', en: 'Fate' },
    catalogue: {
      prefix: MusicalCataloguePrefix.OP,
      number: '67',
      sortOrder: 67,
    },
    performanceDifficulty: 5,
    era: MusicalEra.CLASSICAL,
    instrumentation: 'Symphony Orchestra',
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
      metadata: { ...validMetadata, catalogue: { number: '67' } },
    });
    expect(work1.catalogue).toBe('67');

    const work2 = new Work({
      control: validControl,
      metadata: { ...validMetadata, catalogue: { prefix: MusicalCataloguePrefix.OP } },
    });
    expect(work2.catalogue).toBe('op');

    const work3 = new Work({
      control: validControl,
      metadata: { ...validMetadata, catalogue: undefined },
    });
    expect(work3.catalogue).toBe('');
  });

  it('should handle complex catalogue numbers', () => {
    const work = new Work({
      control: validControl,
      metadata: {
        ...validMetadata,
        catalogue: { prefix: MusicalCataloguePrefix.K, number: '331a' },
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
});
