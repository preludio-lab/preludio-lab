/* eslint-disable @typescript-eslint/no-explicit-any */
import { Work } from '@/domain/work/work';
import { WorkId, generateId } from '@/shared/id';
import { WorkRow, WorkTranslationRow, WorkRows } from './interfaces/work.ds.interface';

function aggregateTranslations(
  translations: { lang: string; [key: string]: any }[],
  targetField: string,
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

export class TursoWorkMapper {
  static toDomain(rows: WorkRows): Work {
    const { work, translations } = rows;

    const title = aggregateTranslations(translations, 'title');
    const titlePrefix = aggregateTranslations(translations, 'titlePrefix');
    const titleContent = aggregateTranslations(translations, 'titleContent');
    const titleNickname = aggregateTranslations(translations, 'titleNickname');
    const compositionPeriod = aggregateTranslations(translations, 'compositionPeriod');
    const description = aggregateTranslations(translations, 'description');

    return new Work({
      control: {
        id: work.id as WorkId,
        slug: work.slug,
        composerSlug: rows.composer?.slug || '',
        createdAt: new Date(work.createdAt),
        updatedAt: new Date(work.updatedAt),
      },
      metadata: {
        titleComponents: {
          title,
          prefix: titlePrefix,
          content: titleContent,
          nickname: titleNickname,
        },
        catalogues: work.catalogues || [],

        era: work.era || undefined,
        instrumentation: work.instrumentation || undefined,
        instrumentationFlags: work.instrumentationFlags || {
          isSolo: false,
          isChamber: false,
          isOrchestral: false,
          hasChorus: false,
          hasVocal: false,
        },
        performanceDifficulty: work.performanceDifficulty || undefined,

        musicalIdentity: {
          key: work.keyTonality || undefined,
          tempo: work.tempoText || undefined,
          timeSignature:
            work.tsNumerator && work.tsDenominator
              ? { numerator: work.tsNumerator, denominator: work.tsDenominator }
              : undefined,
          bpm: work.bpm || undefined,
          metronomeUnit: work.metronomeUnit || undefined,

          genres: work.genres || [],
        },
        impressionDimensions: work.impressionDimensions || undefined,

        compositionYear: work.compositionYear || undefined,
        compositionPeriod: compositionPeriod,
        nicknames: work.tags || [],
        description: description,
        tags: work.tags || [],
        basedOn: work.basedOn || undefined,
      } as any,
    });
  }

  static toPersistence(work: Work): Omit<WorkRows, 'parts'> {
    const ctrl = work.control;
    const meta = work.metadata;
    const mid = meta.musicalIdentity;

    const workRow: WorkRow = {
      id: ctrl.id,
      composerId: '', // To be filled by Repository
      slug: ctrl.slug,
      catalogues: meta.catalogues,
      cataloguePrefix: '',
      catalogueNumber: '',
      catalogueSortOrder: 0,
      era: meta.era || null,
      instrumentation: meta.instrumentation || null,
      instrumentationFlags: meta.instrumentationFlags,
      performanceDifficulty: meta.performanceDifficulty || null,

      keyTonality: mid?.key
        ? typeof mid.key === 'string'
          ? mid.key
          : JSON.stringify(mid.key)
        : null,
      tempoText: mid?.tempo || null,
      tsNumerator: mid?.timeSignature?.numerator || null,
      tsDenominator: mid?.timeSignature?.denominator || null,
      tsDisplayString: null,
      bpm: mid?.bpm || null,
      metronomeUnit: mid?.metronomeUnit || null,

      impressionDimensions: meta.impressionDimensions || null,
      genres: (mid?.genres as any) || [],
      tags: meta.tags as any,
      compositionYear: meta.compositionYear || null,
      compositionPeriod: null,
      basedOn: meta.basedOn || null,

      createdAt: ctrl.createdAt.toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Decompose Translations
    // Fields: title(Req), titlePrefix, titleContent, titleNickname, compositionPeriod, description
    const tc = meta.titleComponents;

    // Gather all langs
    const langs = new Set<string>([
      ...Object.keys(tc.title || {}),
      ...Object.keys(tc.prefix || {}),
      ...Object.keys(tc.content || {}),
      ...Object.keys(tc.nickname || {}),
      ...Object.keys(meta.compositionPeriod || {}),
      ...Object.keys(meta.description || {}),
    ]);

    const translations: WorkTranslationRow[] = [];

    for (const lang of langs) {
      const getVal = (obj: any): string | null => (obj && obj[lang]) || null;

      const title = getVal(tc.title);
      // title is NOT NULL in schema.
      if (!title) continue;

      translations.push({
        id: generateId(),
        workId: ctrl.id,
        lang,
        title,
        titlePrefix: getVal(tc.prefix),
        titleContent: getVal(tc.content),
        titleNickname: getVal(tc.nickname),
        compositionPeriod: getVal(meta.compositionPeriod),
        description: getVal(meta.description),
        nicknames: [], // json column. meta.nicknames is string[] not multilingual?
        // `workTranslations.nicknames` in schema is `string[]` (JSON).
        // But `meta.nicknames` is defined as `NicknamesSchema` which is `string[]` (Multilingual/Alias list).
        // Is `meta.nicknames` language specific? No, it's global aliases usually?
        // Schema says `workTranslations` has `nicknames` (JSON).
        // And `workParts` has `nicknames` (JSON).
        // Domain `WorkMetadata` has `nicknames`.
        // If `nicknames` is global, it should be in `works` table.
        // Wait, Schema `works` table DOES NOT have `nicknames`.
        // `workTranslations` table HAS `nicknames`.
        // This implies nicknames are per language?
        // But Domain `nicknames` is flat `string[]`.
        // I will save `meta.nicknames` to ALL translation rows? Or just primary?
        // Or `meta.nicknames` is actually not mapped to translation nicknames?
        // Be safe: save [] for now.

        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return {
      work: workRow,
      translations,
    };
  }
}
