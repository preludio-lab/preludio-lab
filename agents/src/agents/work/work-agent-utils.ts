import { type WorkDraft } from '@/schemas/work.js';

export const MULTI_MOVEMENT_GENRES = [
  'symphony',
  'concerto',
  'sonata',
  'suite',
  'mass',
  'opera',
  'oratorio',
  'string-quartet',
  'piano-trio',
  'trio-sonata',
  'divertimento',
  'serenade',
];

/**
 * 主要なジャンルIDから日本語名へのマッピング（冗長タイトルの検知用）
 */
const GENRE_JA_MAP: Record<string, string> = {
  symphony: '交響曲',
  concerto: '協奏曲',
  'piano-concerto': 'ピアノ協奏曲',
  'violin-concerto': 'ヴァイオリン協奏曲',
  'cello-concerto': 'チェロ協奏曲',
  'piano-sonata': 'ピアノソナタ',
  'violin-sonata': 'ヴァイオリンソナタ',
  'cello-sonata': 'チェロソナタ',
  sonata: 'ソナタ',
  'string-quartet': '弦楽四重奏曲',
  'piano-trio': 'ピアノ三重奏曲',
  'suite-orch': '管弦楽組曲',
  'tone-poem': '交響詩',
  'serenade-divertimento': 'セレナード',
};

/**
 * 楽曲データの正規化（音楽学的な制約に基づくクリーンアップ）を行います。
 */
export function normalizeWorkDraft<T extends WorkDraft>(data: T): T {
  // 物理的な削除を可能にするため、シャローコピーを作成
  const res = { ...data } as Record<string, unknown>;
  const genres = (res['genres'] as string[]) || [];
  const slug = (res['slug'] as string) || '';

  const isMultiMovement =
    genres.some((g: string) => MULTI_MOVEMENT_GENRES.includes(g)) ||
    slug.includes('concerto') ||
    slug.includes('symphony');

  if (isMultiMovement) {
    // 多楽章形式の場合、Workレベル（全体）での演奏情報は【原則禁止】
    delete res['tempo'];
    delete res['bpm'];
    delete res['timeSignature'];
    delete res['tempoTranslation'];
    delete res['metronomeUnit'];
  }

  // titleComponents のクリーンアップ
  if (res['titleComponents']) {
    const tc = { ...res['titleComponents'] } as Record<string, unknown>;
    for (const key of Object.keys(tc)) {
      const val = tc[key];
      if (val === null || val === undefined) {
        delete tc[key];
        continue;
      }
      // 多言語オブジェクトの中身が "none" や空文字の場合も削除
      if (typeof val === 'object' && val !== null && (val as Record<string, unknown>)['ja']) {
        const ja = String((val as Record<string, unknown>)['ja'])
          .toLowerCase()
          .trim();
        if (
          ja === 'none' ||
          ja === 'null' ||
          ja === '' ||
          ja === 'なし' ||
          ja === 'no nickname' ||
          ja === 'no distinctive title' ||
          ja === 'n/a' ||
          ja === 'unknown'
        ) {
          delete tc[key];
          continue;
        }

        // 冗長なデータの検知と削除 (distinctiveTitle と nickname 両方に適用)
        if (key === 'distinctiveTitle' || key === 'nickname') {
          const number = res['number'] as number | undefined;
          const genreNames = genres.map((g) => GENRE_JA_MAP[g] || '');
          const genreIds = genres;
          const slug = String(res['slug'] || '');

          // 判定用の規格化文字列（記号・スペース・ハイフンを完全に除去し小文字化）
          const clean = (s: string) => s.replace(/[\s\.\-\_\(\)\[\]]/g, '').toLowerCase();
          const normalizedJa = clean(ja);
          const normalizedSlug = clean(slug);

          // スラグと一致（またはスラグの一部）なら削除
          if (normalizedJa === normalizedSlug || normalizedSlug.includes(normalizedJa)) {
            delete tc[key];
            continue;
          }

          // パターン1: 日本語での重複（「ピアノ協奏曲第20番」等）
          const isRedundantJa = genreNames.some((gn) => {
            if (!gn) return false;
            const p1 = clean(`${gn}第${number}番`);
            const p2 = clean(`${gn}${number}番`);
            const p3 = clean(gn);
            return normalizedJa === p1 || normalizedJa === p2 || normalizedJa === p3;
          });

          // パターン2: 英語・ID形式での重複（「Piano Concerto No. 20」等）
          const isRedundantEn = genreIds.some((gi) => {
            const giClean = clean(gi);
            const p1 = clean(`${giClean}no${number}`);
            const p2 = clean(`${giClean}number${number}`);
            const p3 = clean(`${giClean}${number}`);
            // 「Concerto」単体などもチェック
            const isGeneric =
              normalizedJa.includes('concerto') ||
              normalizedJa.includes('symphony') ||
              normalizedJa.includes('sonata');

            return (
              normalizedJa === p1 ||
              normalizedJa === p2 ||
              normalizedJa === p3 ||
              normalizedJa === giClean ||
              (isGeneric && normalizedJa.includes(String(number)))
            );
          });

          // パターン3: 番号のみ
          const isRedundantNum =
            number !== undefined &&
            (normalizedJa === `第${number}番` ||
              normalizedJa === `第${number}` ||
              normalizedJa === `no${number}` ||
              normalizedJa === `${number}番`);

          if (isRedundantJa || isRedundantEn || isRedundantNum) {
            delete tc[key];
            continue;
          }
        }
      }

      // 物理的な削除（多言語オブジェクトが空になった場合など）
      if (typeof val === 'object' && Object.keys(val).length === 0) {
        delete tc[key];
      }
    }
    res['titleComponents'] = tc;
  }

  // basedOn のクリーンアップ
  const basedOn = res['basedOn'] as Record<string, unknown> | undefined;
  if (basedOn) {
    const originalSlug = String(basedOn['originalWorkSlug'] || '').toLowerCase();
    if (!originalSlug || originalSlug === 'none' || originalSlug === 'null') {
      delete res['basedOn'];
    }
  }

  // 最終的な「物理的削除」の徹底
  for (const key of Object.keys(res)) {
    if (res[key] === undefined || res[key] === null) {
      delete res[key];
    }
  }

  return res as T;
}
