import { Work, WorkId } from '@/domain/work/work';
import { WorkMetadata } from '@/domain/work/work.metadata';
import { generateId } from '@/shared/id';
import { WorkTranslationRow, WorkRows } from './interfaces/work.ds.interface';
import { WorkTitleFormatter } from '@/domain/work/work-title-formatter';
import { MultilingualString } from '@/domain/i18n/locale';
import { MusicalKey } from '@/domain/work/musical-key';
import { MusicalEra } from '@/domain/shared/musical-era';
import { MetronomeUnit } from '@/domain/work/work.shared';
import { MusicalGenre } from '@/domain/shared/musical-genre';
import { MusicalInstrument } from '@/domain/shared/musical-instrument';

function aggregateTranslations(
  translations: { lang: string; [key: string]: unknown }[],
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
        titleComponents: work.titleComponents || { displayType: 'standard' },
        catalogues: work.catalogues || [],

        era: (work.era as MusicalEra) || undefined,
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
          key: (work.keyTonality as MusicalKey) || undefined,
          tempo: work.tempoText || undefined,
          timeSignature:
            work.tsNumerator && work.tsDenominator
              ? { numerator: work.tsNumerator, denominator: work.tsDenominator }
              : undefined,
          bpm: work.bpm || undefined,
          metronomeUnit: (work.metronomeUnit as MetronomeUnit) || undefined,

          genres: (work.genres as MusicalGenre[]) || [],
        },
        impressionDimensions: work.impressionDimensions || undefined,

        compositionYear: work.compositionYear || undefined,
        compositionPeriod: compositionPeriod,
        description: description,
        tags: work.tags || [],
        instruments: (work.instruments as MusicalInstrument[]) || [],
        basedOn: work.basedOn || undefined,
        nicknames: work.tags || [],
      } as unknown as WorkMetadata,
    });
  }

  static toPersistence(work: Work): Omit<WorkRows, 'parts'> {
    const ctrl = work.control;
    const meta = work.metadata;
    const mid = meta.musicalIdentity;

    const tc = meta.titleComponents;
    const langs = new Set<string>([
      ...Object.keys(tc.distinctiveTitle || {}),
      ...Object.keys(tc.nickname || {}),
      ...Object.keys(meta.compositionPeriod || {}),
      ...Object.keys(meta.description || {}),
      'en',
      'ja',
    ]);

    const fullTitle: Record<string, string> = {};
    const translations: WorkTranslationRow[] = [];

    for (const lang of langs) {
      const title = WorkTitleFormatter.format({
        locale: lang,
        components: tc,
        genres: mid?.genres,
        key: mid?.key as string | undefined,
        catalogues: meta.catalogues,
      });

      if (title) {
        fullTitle[lang] = title;
      }

      const getVal = (obj: MultilingualString | undefined): string | null =>
        (obj && obj[lang as keyof MultilingualString]) || null;

      translations.push({
        id: generateId(),
        workId: ctrl.id,
        lang,
        title: title || '',
        titlePrefix: null,
        titleContent: null,
        titleNickname: getVal(tc.nickname as MultilingualString),
        titleComponents: tc,
        compositionPeriod: getVal(meta.compositionPeriod),
        description: getVal(meta.description),
        nicknames: [],
        createdAt: new Date(ctrl.createdAt).toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const workRow: any = {
      id: ctrl.id,
      composerId: '', // To be filled by Repository
      slug: ctrl.slug,
      catalogues: meta.catalogues,
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
      tsDisplayString: mid?.timeSignature?.displayString || null,
      bpm: mid?.bpm || null,
      metronomeUnit: mid?.metronomeUnit || null,

      impressionDimensions: meta.impressionDimensions || null,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      genres: (mid?.genres || []) as any,
      tags: meta.tags || [],
      instruments: meta.instruments || [],
      compositionYear: meta.compositionYear || null,
      compositionPeriod: null,
      basedOn: meta.basedOn || null,

      titleComponents: tc,
      fullTitle,
      searchText: Object.values(fullTitle).join(' '),

      createdAt: ctrl.createdAt.toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      work: workRow,
      translations,
    };
  }
}
