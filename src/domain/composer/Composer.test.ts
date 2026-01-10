import { describe, it, expect } from 'vitest';
import { Composer } from './Composer';
import { ComposerMetadataSchema } from './ComposerMetadata';
import { MusicalEra } from '../shared/MusicalEra';

describe('Composer Entity', () => {
    const validControl = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        slug: 'beethoven',
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const validMetadata = {
        fullName: { ja: 'ルートヴィヒ・ヴァン・ベートーヴェン', en: 'Ludwig van Beethoven' },
        displayName: { ja: 'L. v. ベートーヴェン', en: 'L. v. Beethoven' },
        shortName: { ja: 'ベートーヴェン', en: 'Beethoven' },
        era: MusicalEra.CLASSICAL,
        biography: { ja: '偉大な作曲家', en: 'Great composer' },
        birthDate: new Date('1770-12-17'),
        deathDate: new Date('1827-03-26'),
        nationalityCode: 'DE',
        representativeInstruments: ['Piano'],
        representativeGenres: ['Piano Sonata', 'Symphony'],
        places: [
            { slug: 'bonn', type: 'birth' as const, countryCode: 'DE' },
            { slug: 'vienna', type: 'activity' as const, countryCode: 'AT' },
        ],
        portrait: '/images/composers/beethoven.webp',
        tags: ['Classical', 'Romantic'],
    };

    it('should create a valid Composer instance', () => {
        const composer = new Composer({
            control: validControl,
            metadata: validMetadata,
        });

        expect(composer.id).toBe(validControl.id);
        expect(composer.slug).toBe(validControl.slug);
        expect(composer.fullName.en).toBe('Ludwig van Beethoven');
        expect(composer.displayName.en).toBe('L. v. Beethoven');
        expect(composer.shortName.en).toBe('Beethoven');
        expect(composer.era).toBe(MusicalEra.CLASSICAL);
        expect(composer.biography?.en).toBe('Great composer');
        expect(composer.birthDate).toEqual(validMetadata.birthDate);
        expect(composer.nationalityCode).toBe('DE');
        expect(composer.representativeInstruments).toContain('Piano');
        expect(composer.representativeGenres).toContain('Symphony');
        expect(composer.places[0].slug).toBe('bonn');
        expect(composer.portrait).toBe('/images/composers/beethoven.webp');
        expect(composer.tags).toContain('Classical');
    });

    it('should clone with partial updates', () => {
        const composer = new Composer({
            control: validControl,
            metadata: validMetadata,
        });

        const cloned = composer.cloneWith({
            metadata: { nationalityCode: 'AT' },
        });

        expect(cloned.nationalityCode).toBe('AT');
        expect(cloned.id).toBe(composer.id);
        expect(cloned.fullName).toEqual(validMetadata.fullName);
    });

    it('should validate metadata using schema', () => {
        const result = ComposerMetadataSchema.safeParse(validMetadata);
        expect(result.success).toBe(true);
    });
});
