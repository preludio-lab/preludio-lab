import { WorkPart, WorkPartId } from '@/domain/work/work-part';
import { WorkId } from '@/domain/work/work';
import { generateId } from '@/shared/id';
import { WorkPartRows, WorkPartRow, WorkPartTranslationRow } from './interfaces/work.ds.interface';
import { WorkTitleFormatter } from '@/domain/work/work-title-formatter';
import { MultilingualString } from '@/domain/i18n/locale';
import { WorkPartType } from '@/domain/work/work-part.metadata';
import { MusicalKey } from '@/domain/work/musical-key';
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

export class TursoWorkPartMapper {
  static toDomain(rows: WorkPartRows): WorkPart {
    const { part, translations } = rows;

    const description = aggregateTranslations(translations, 'description');

    return new WorkPart(
      {
        id: part.id as WorkPartId,
        slug: part.slug,
        workId: part.workId as WorkId,
        order: part.sortOrder,
        createdAt: new Date(part.createdAt),
        updatedAt: new Date(part.updatedAt),
      },
      {
        titleComponents: part.titleComponents || { displayType: 'standard' },
        catalogues: part.catalogues || [],
        type: (part.type as WorkPartType) || 'movement',
        isNameStandard: part.isNameStandard ?? true,

        description: description,

        musicalIdentity: {
          key: (part.keyTonality as MusicalKey) || undefined,
          tempo: part.tempoText || undefined,
          timeSignature:
            part.tsNumerator && part.tsDenominator
              ? { numerator: part.tsNumerator, denominator: part.tsDenominator }
              : undefined,
          bpm: part.bpm || undefined,
          metronomeUnit: (part.metronomeUnit as MetronomeUnit) || undefined,
          genres: (part.genres as MusicalGenre[]) || [],
        },
        impressionDimensions: part.impressionDimensions || undefined,
        nicknames: part.nicknames || [],
        tags: [],
        instruments: (part.instruments as MusicalInstrument[]) || [],
        basedOn: part.basedOn || undefined,
        performanceDifficulty: part.performanceDifficulty || undefined,
      },
    );
  }

  static toPersistence(entity: WorkPart): WorkPartRows {
    const ctrl = entity.control;
    const meta = entity.metadata;
    const mid = meta.musicalIdentity;

    const tc = meta.titleComponents;
    const langs = new Set<string>([
      ...Object.keys(tc.distinctiveTitle || {}),
      ...Object.keys(tc.nickname || {}),
      ...Object.keys(meta.description || {}),
      'en',
      'ja',
    ]);

    const fullTitle: Record<string, string> = {};
    const translations: WorkPartTranslationRow[] = [];

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
        workPartId: ctrl.id,
        lang,
        title: title || '',
        titlePrefix: null,
        titleContent: null,
        titleNickname: getVal(tc.nickname as MultilingualString),
        titleComponents: tc,
        tempoTranslation: null,
        description: getVal(meta.description),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    const partRow: WorkPartRow = {
      id: ctrl.id,
      workId: ctrl.workId,
      slug: ctrl.slug,
      sortOrder: ctrl.order,

      type: meta.type || null,
      isNameStandard: meta.isNameStandard,

      catalogues: meta.catalogues || [],

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
      performanceDifficulty: meta.performanceDifficulty || null,

      nicknames: meta.nicknames || [],
      instruments: meta.instruments || [],

      basedOn: meta.basedOn || null,

      titleComponents: tc,
      fullTitle,

      createdAt: ctrl.createdAt.toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      part: partRow,
      translations,
    };
  }
}
