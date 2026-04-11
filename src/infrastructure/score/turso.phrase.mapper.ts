import { Phrase, PhraseId } from '@/domain/score/phrase';
import { NotationFormat } from '@/domain/score/phrase.metadata';
import { PhraseRow, PhraseTranslationRow, PhraseRows } from './interfaces/phrase.ds.interface';

/**
 * 翻訳データを集約するヘルパー
 */
function aggregateTranslations(
  translations: { lang: string; [key: string]: unknown }[],
  targetField: string,
): Record<string, string> {
  const result: Record<string, string> = {};
  translations.forEach((t) => {
    const val = t[targetField];
    if (val) {
      result[t.lang] = val as string;
    }
  });
  return result;
}

export class TursoPhraseMapper {
  /**
   * DB行からドメインモデルへ変換 (Join済みの PhraseRows を入力とする)
   */
  static toDomain(rows: PhraseRows): Phrase {
    const { phrase, translations, composer, work, workPart, score } = rows;

    const captions = aggregateTranslations(translations, 'caption');

    return {
      control: {
        id: phrase.id as PhraseId,
        slug: phrase.slug,
        createdAt: new Date(phrase.createdAt),
        updatedAt: new Date(phrase.updatedAt),
      },
      metadata: {
        slug: phrase.slug,
        composerSlug: composer?.slug,
        workSlug: work?.slug,
        workPartSlug: workPart?.slug,
        scoreSlug: score?.slug,
        format: phrase.format as NotationFormat,
        notationPath: phrase.dataStoragePath || '',
        measureRange: phrase.measureRange ? JSON.parse(phrase.measureRange) : undefined,
        caption: {
          ja: captions.ja || '', // ja 必須
          ...captions,
        },
      },
      samples: phrase.recordingSegments ? JSON.parse(phrase.recordingSegments) : [],
    };
  }

  /**
   * ドメインモデルからDB行（永続化形式）へ変換
   * 外側の ID (workId 等) は Repository 側で注入・解決してセットする
   */
  static toPersistence(phrase: Phrase): {
    phrase: PhraseRow;
    translations: PhraseTranslationRow[];
  } {
    const ctrl = phrase.control;
    const meta = phrase.metadata;

    const phraseRow: PhraseRow = {
      id: ctrl.id,
      workId: '', // Repository にて解決
      workPartId: null, // Repository にて解決
      scoreId: null, // Repository にて解決
      slug: ctrl.slug,
      format: meta.format,
      dataStoragePath: meta.notationPath,
      measureRange: meta.measureRange ? JSON.stringify(meta.measureRange) : null,
      recordingSegments: phrase.samples ? JSON.stringify(phrase.samples) : null,
      createdAt: ctrl.createdAt.toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const translations: PhraseTranslationRow[] = [];
    const langs = Object.keys(meta.caption || {});

    langs.forEach((lang) => {
      const captionVal = meta.caption?.[lang as keyof typeof meta.caption];
      if (captionVal) {
        translations.push({
          phraseId: ctrl.id,
          lang,
          caption: captionVal,
          createdAt: ctrl.createdAt.toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });

    return {
      phrase: phraseRow,
      translations,
    };
  }
}
