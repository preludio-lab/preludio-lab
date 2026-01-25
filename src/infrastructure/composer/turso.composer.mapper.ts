/* eslint-disable @typescript-eslint/no-explicit-any */
import { Composer } from '@/domain/composer/composer';
import {
  ComposerRow,
  ComposerTranslationRow,
  ComposerRows,
} from './interfaces/composer.ds.interface';

/**
 * Helper to aggregate translations array into a multilingual object
 */
function aggregateTranslations(
  translations: ComposerTranslationRow[],
  targetField: keyof ComposerTranslationRow,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const t of translations) {
    const val = t[targetField];
    if (val) {
      result[t.lang] = val as string;
    }
  }
  return result;
}

export class TursoComposerMapper {
  /**
   * Convert DB Rows to Domain Entity
   */
  static toDomain(rows: ComposerRows): Composer {
    const { composer, translations } = rows;

    // Aggregate translations
    const fullName = aggregateTranslations(translations, 'fullName');
    const displayName = aggregateTranslations(translations, 'displayName');
    const shortName = aggregateTranslations(translations, 'shortName');
    const biography = aggregateTranslations(translations, 'biography');

    // Reconstruct Entity
    return new Composer({
      control: {
        id: composer.id,
        slug: composer.slug,
        createdAt: new Date(composer.createdAt),
        updatedAt: new Date(composer.updatedAt),
      },
      metadata: {
        fullName,
        displayName,
        shortName,
        biography,

        era: (composer.era as any) || undefined,
        birthDate: composer.birthDate ? new Date(composer.birthDate) : undefined,
        deathDate: composer.deathDate ? new Date(composer.deathDate) : undefined,
        nationalityCode: (composer.nationalityCode as any) || undefined,

        representativeInstruments: (composer.representativeInstruments as any) || [],
        representativeGenres: composer.representativeGenres || [],
        places: composer.places || [],
        impressionDimensions: composer.impressionDimensions || undefined,

        portrait: composer.portraitImagePath || undefined, // Mapped to 'portrait'
        tags: composer.tags || [],
      },
    });
  }

  /**
   * Convert Domain Entity to DB Rows
   */
  static toPersistence(entity: Composer): ComposerRows {
    const control = entity.control;
    const metadata = entity.metadata;

    const composerRow: ComposerRow = {
      id: control.id,
      slug: control.slug,
      era: (metadata.era as any) || null,
      birthDate: metadata.birthDate ? metadata.birthDate.toISOString() : null,
      deathDate: metadata.deathDate ? metadata.deathDate.toISOString() : null,
      nationalityCode: (metadata.nationalityCode as any) || null,

      representativeInstruments: (metadata.representativeInstruments as any) || [],
      representativeGenres: metadata.representativeGenres,
      places: metadata.places,
      impressionDimensions: metadata.impressionDimensions || null,
      tags: metadata.tags,
      portraitImagePath: metadata.portrait || null,

      createdAt: control.createdAt.toISOString(),
      updatedAt: new Date().toISOString(), // Always update timestamp on save
    };

    // Decompose Translations
    // We assume all multilingual fields share the same set of keys (languages).
    // We collect all unique languages found in any of the fields.
    const langs = new Set<string>([
      ...Object.keys(metadata.fullName || {}),
      ...Object.keys(metadata.displayName || {}),
      ...Object.keys(metadata.shortName || {}),
      ...Object.keys(metadata.biography || {}),
    ]);

    const translations: ComposerTranslationRow[] = [];

    for (const lang of langs) {
      // Helper to safely get string value for lang
      const getVal = (obj: any): string => (obj && obj[lang]) || '';

      // We must ensure required fields are present.
      // Schema says fullName, displayName, shortName are NOT NULL.
      // If a language is missing one of these, we might fail DB constraint.
      // For Master Data Sync, we trust the input is valid or we handle it.
      // Currently, if "en" has full/display/short, and "ja" has full/display/short, we are good.
      // If "biography" only exists in "en", then "ja" row will have null biography (allowed).

      const fn = getVal(metadata.fullName);
      const dn = getVal(metadata.displayName);
      const sn = getVal(metadata.shortName);

      if (!fn || !dn || !sn) {
        // Skip incomplete translation rows? Or save empty string?
        // If it's a "Partial" translation, we might skip or fail.
        // For now, if "Required" fields are missing for a lang, we imply that lang is not supported for Core Identity.
        continue;
      }

      translations.push({
        id: crypto.randomUUID(), // New ID for every save/row?
        // Or we use a deterministic ID based on ComposerID + Lang?
        // Schema definition: id text primary key.
        // If we Delete & Insert, new ID is fine.
        // But if we want stable IDs, we might need hash.
        // For now, new UUID v7 is fine as we delete old rows.
        composerId: control.id,
        lang,
        fullName: fn,
        displayName: dn,
        shortName: sn,
        biography: getVal(metadata.biography) || null,
        // profileEmbedding not handled yet without vector logic.
        profileEmbedding: null,
        createdAt: new Date().toISOString(), // New row
        updatedAt: new Date().toISOString(),
      });
    }

    return {
      composer: composerRow,
      translations,
    };
  }
}
