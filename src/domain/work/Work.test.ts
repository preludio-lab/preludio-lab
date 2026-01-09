import { describe, it, expect } from 'vitest';
import { Work } from './Work';

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
        cataloguePrefix: 'Op.',
        catalogueNumber: 67,
        musicalIdentity: {
            key: 'c-minor',
            tempo: 'Allegro con brio',
            tempoTranslation: { ja: '快活に、元気に', en: 'Lively and with spirit' },
            timeSignature: { numerator: 2, denominator: 4 },
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
        expect(work.metadata.musicalIdentity?.key).toBe('c-minor');
        expect(work.metadata.musicalIdentity?.tempo).toBe('Allegro con brio');
        expect(work.metadata.musicalIdentity?.tempoTranslation?.ja).toBe('快活に、元気に');
        expect(work.metadata.musicalIdentity?.timeSignature?.numerator).toBe(2);
        expect(work.hasParts()).toBe(true);
    });

    it('should correctly format catalogue when prefix or number is missing', () => {
        const work1 = new Work({
            control: validControl,
            metadata: { ...validMetadata, cataloguePrefix: undefined, tags: [] },
        });
        expect(work1.catalogue).toBe('67');

        const work2 = new Work({
            control: validControl,
            metadata: { ...validMetadata, catalogueNumber: undefined, tags: [] },
        });
        expect(work2.catalogue).toBe('Op.');

        const work3 = new Work({
            control: validControl,
            metadata: {
                ...validMetadata,
                cataloguePrefix: undefined,
                catalogueNumber: undefined,
                tags: [],
            },
        });
        expect(work3.catalogue).toBe('');
    });

    it('should clone with partial updates', () => {
        const work = new Work({
            control: validControl,
            metadata: validMetadata,
        });

        const cloned = work.cloneWith({
            control: { composer: 'brahms' },
            metadata: { compositionYear: 1807 },
        });

        expect(cloned.composer).toBe('brahms');
        expect(cloned.metadata.compositionYear).toBe(1807);
        expect(cloned.id).toBe(work.id); // Identity remains same
    });
});
