import { describe, it, expect } from 'vitest';
import { Composer } from './composer';
import { ComposerId } from '@/shared/id';
import { ComposerMetadataSchema } from './composer.metadata';
import { MusicalEra } from '../shared/musical-era';
import { Nationality } from '../shared/nationality';
import { MusicalInstrument } from '../shared/musical-instrument';
import { MusicalGenre } from '../shared/musical-genre';
import { MusicalPlace } from '../shared/musical-place';

describe('Composer Entity', () => {
  const validControl = {
    id: '550e8400-e29b-41d4-a716-446655440000' as ComposerId,
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
    nationalityCode: Nationality.DE,
    representativeInstruments: [MusicalInstrument.PIANO],
    representativeGenres: [MusicalGenre.FORM.SONATA, MusicalGenre.ORCHESTRAL.SYMPHONY],
    places: [
      { slug: MusicalPlace.BONN, type: 'birth' as const, countryCode: Nationality.DE },
      { slug: MusicalPlace.VIENNA, type: 'activity' as const, countryCode: Nationality.AT },
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
    expect(composer.nationalityCode).toBe(Nationality.DE);
    expect(composer.representativeInstruments).toContain(MusicalInstrument.PIANO);
    expect(composer.representativeGenres).toContain(MusicalGenre.ORCHESTRAL.SYMPHONY);
    expect(composer.places[0].slug).toBe(MusicalPlace.BONN);
    expect(composer.portrait).toBe('/images/composers/beethoven.webp');
    expect(composer.tags).toContain('Classical');
  });

  it('should clone with partial updates', () => {
    const composer = new Composer({
      control: validControl,
      metadata: validMetadata,
    });

    const cloned = composer.cloneWith({
      metadata: { nationalityCode: Nationality.AT },
    });

    expect(cloned.nationalityCode).toBe(Nationality.AT);
    expect(cloned.id).toBe(composer.id);
    expect(cloned.fullName).toEqual(validMetadata.fullName);
  });

  it('should validate metadata using schema', () => {
    const result = ComposerMetadataSchema.safeParse(validMetadata);
    expect(result.success).toBe(true);
  });

  it('should handle impression dimensions', () => {
    const dimensions = {
      innovation: 8,
      emotionality: 5,
      nationalism: -2,
      scale: 7,
      complexity: 6,
      theatricality: 3,
    };

    const composer = new Composer({
      control: validControl,
      metadata: {
        ...validMetadata,
        impressionDimensions: dimensions,
      },
    });

    expect(composer.impressionDimensions).toEqual(dimensions);
    expect(composer.innovation).toBe(8);
    expect(composer.emotionality).toBe(5);
    expect(composer.nationalism).toBe(-2);
    expect(composer.scale).toBe(7);
    expect(composer.complexity).toBe(6);
    expect(composer.theatricality).toBe(3);
  });
});
