import { WorkPart, WorkPartId } from '@/domain/work/work-part';
import { WorkId } from '@/domain/work/work';
import { generateId } from '@/shared/id';
import { WorkPartRows, WorkPartRow, WorkPartTranslationRow } from './interfaces/work.ds.interface';

function aggregateTranslations(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

export class TursoWorkPartMapper {
  static toDomain(rows: WorkPartRows): WorkPart {
    const { part, translations } = rows;

    const title = aggregateTranslations(translations, 'title');
    const titlePrefix = aggregateTranslations(translations, 'titlePrefix');
    const titleContent = aggregateTranslations(translations, 'titleContent');
    const titleNickname = aggregateTranslations(translations, 'titleNickname');
    const description = aggregateTranslations(translations, 'description');

    return new WorkPart(
      {
        id: part.id as WorkPartId,
        slug: part.slug,
        workId: part.workId as WorkId,
        order: part.sortOrder,
        createdAt: new Date(part.createdAt),
        updatedAt: new Date(part.updatedAt),
      } as any as any, // eslint-disable-line @typescript-eslint/no-explicit-any
      {
        titleComponents: {
          title,
          prefix: titlePrefix,
          content: titleContent,
          nickname: titleNickname,
        },
        catalogues: part.catalogues || [],
        type: part.type || undefined,
        isNameStandard: false,

        description: description,

        musicalIdentity: {
          key: part.keyTonality || undefined,
          tempo: part.tempoText || undefined,
          timeSignature:
            part.tsNumerator && part.tsDenominator
              ? { numerator: part.tsNumerator, denominator: part.tsDenominator }
              : undefined,
          bpm: part.bpm || undefined,
          metronomeUnit: part.metronomeUnit || undefined,
          genres: part.genres || [],
        },
        impressionDimensions: part.impressionDimensions || undefined,
        nicknames: part.nicknames || [],
        basedOn: part.basedOn || undefined,
        performanceDifficulty: part.performanceDifficulty || undefined,
      } as any as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    );
  }

  static toPersistence(entity: WorkPart): WorkPartRows {
    const ctrl = entity.control;
    const meta = entity.metadata;
    const mid = meta.musicalIdentity;

    const partRow: WorkPartRow = {
      id: ctrl.id,
      workId: ctrl.workId,
      slug: ctrl.slug,
      sortOrder: ctrl.order,

      type: meta.type || null,

      catalogues: meta.catalogues || [],

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
      genres: mid?.genres || [],
      performanceDifficulty: meta.performanceDifficulty || null,

      nicknames: meta.nicknames || [],

      basedOn: meta.basedOn || null,

      createdAt: ctrl.createdAt.toISOString(),
      updatedAt: new Date().toISOString(),
    } as any as any; // eslint-disable-line @typescript-eslint/no-explicit-any

    const tc = meta.titleComponents;
    const langs = new Set<string>([
      ...Object.keys(tc.title || {}),
      ...Object.keys(tc.prefix || {}),
      ...Object.keys(tc.content || {}),
      ...Object.keys(tc.nickname || {}),
      ...Object.keys(meta.description || {}),
    ]);

    const translations: WorkPartTranslationRow[] = [];
    for (const lang of langs) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const getVal = (obj: any): string | null => (obj && obj[lang]) || null;
      if (!getVal(tc.title)) continue;

      translations.push({
        id: generateId(), // Generic ID for translation record
        workPartId: ctrl.id,
        lang,
        title: getVal(tc.title)!,
        titlePrefix: getVal(tc.prefix),
        titleContent: getVal(tc.content),
        titleNickname: getVal(tc.nickname),
        tempoTranslation: null, // No source currently
        description: getVal(meta.description),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    return {
      part: partRow,
      translations,
    };
  }
}
