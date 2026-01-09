import { describe, it, expect } from 'vitest';
import { Work } from './Work';
import { MetronomeUnit } from './WorkMetadata';
import { MusicalEra } from '../shared/MusicalEra';

describe('Work Entity', () => {
    const validControl = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        composer: 'beethoven',
        slug: 'symphony-no5',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const validMetadata = {
        title: { ja: '交響曲第5番', en: 'Symphony No. 5' },
        popularTitle: { ja: '運命', en: 'Fate' },
        catalogue: {
            prefix: 'Op.',
            number: '67',
            sortOrder: 67
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
            key: 'c-minor',
            genres: ['symphony'],
            tempo: 'Allegro con brio',
            tempoTranslation: { ja: '快活に、元気に', en: 'Lively and with spirit' },
            timeSignature: { numerator: 2, denominator: 4 },
            bpm: 108,
            metronomeUnit: MetronomeUnit.QUARTER,
        },
        compositionYear: 1808,
        parts: [
            {
                id: '550e8400-e29b-41d4-a716-446655440001',
                slug: '1st-mov',
                order: 1,
                title: { ja: '第1楽章', en: '1st Movement' },
                musicalIdentity: {
                    key: 'c-minor',
                    genres: ['sonata-form'],
                    tempo: 'Allegro con brio',
                    timeSignature: { numerator: 2, denominator: 4 },
                }
            },
        ],
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
        expect(work.composer).toBe(validControl.composer);
        expect(work.title.ja).toBe('交響曲第5番');
        expect(work.catalogue).toBe('Op. 67');
        expect(work.era).toBe(MusicalEra.CLASSICAL);
        expect(work.genres).toContain('symphony');
        expect(work.performanceDifficulty).toBe(5);
        expect(work.instrumentationFlags.isOrchestral).toBe(true);
        expect(work.metadata.musicalIdentity?.key).toBe('c-minor');
        expect(work.metadata.musicalIdentity?.bpm).toBe(108);
        expect(work.hasParts()).toBe(true);
    });

    it('should correctly format catalogue when properties are missing', () => {
        const work1 = new Work({
            control: validControl,
            metadata: { ...validMetadata, catalogue: { number: '67' } },
        });
        expect(work1.catalogue).toBe('67');

        const work2 = new Work({
            control: validControl,
            metadata: { ...validMetadata, catalogue: { prefix: 'Op.' } },
        });
        expect(work2.catalogue).toBe('Op.');

        const work3 = new Work({
            control: validControl,
            metadata: { ...validMetadata, catalogue: undefined },
        });
        expect(work3.catalogue).toBe('');
    });

    it('should handle complex catalogue numbers', () => {
        const work = new Work({
            control: validControl,
            metadata: { ...validMetadata, catalogue: { prefix: 'K.', number: '331a' } },
        });
        expect(work.catalogue).toBe('K. 331a');
    });

    it('should clone with partial updates', () => {
        const work = new Work({
            control: validControl,
            metadata: validMetadata,
        });

        const cloned = work.cloneWith({
            control: { composer: 'brahms' },
            metadata: { performanceDifficulty: 4 },
        });

        expect(cloned.composer).toBe('brahms');
        expect(cloned.metadata.performanceDifficulty).toBe(4);
        expect(cloned.id).toBe(work.id);
    });
});
