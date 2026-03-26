import { Work, WorkId } from '@/domain/work/work';
import { WorkMetadata } from '@/domain/work/work.metadata';
import { generateId } from '@/shared/id';
import { WorkRow, WorkTranslationRow, WorkRows } from './interfaces/work.ds.interface';

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
        instruments: work.instruments || [],
        basedOn: work.basedOn || undefined,
      } as unknown as WorkMetadata,
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
      genres: (mid?.genres as unknown as string[]) || [],
      tags: (meta.tags as unknown as string[]) || [],
      instruments: (meta.instruments as unknown as string[]) || [],
      compositionYear: meta.compositionYear || null,
      compositionPeriod: null,
      basedOn: meta.basedOn || null,

      createdAt: ctrl.createdAt.toISOString(),
      updatedAt: new Date().toISOString(),
    } as unknown as WorkRow;

    const tc = meta.titleComponents;
    const langs = new Set<string>([
      ...Object.keys(tc.prefix || {}),
      ...Object.keys(tc.content || {}),
      ...Object.keys(tc.nickname || {}),
      ...Object.keys(meta.compositionPeriod || {}),
      ...Object.keys(meta.description || {}),
    ]);

    const translations: WorkTranslationRow[] = [];

    for (const lang of langs) {
      const getVal = (obj: Record<string, string> | undefined): string | null =>
        (obj && obj[lang]) || null;

      const prefix = getVal(tc.prefix);
      const content = getVal(tc.content);
      const title = [prefix, content].filter(Boolean).join(' ');

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
        nicknames: [],
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
