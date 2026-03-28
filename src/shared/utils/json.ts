/**
 * JSONデータの正規化と翻訳データのマージを行う共通ユーティリティ
 */

const PRUNE_MAGIC_WORDS = ['none', 'なし', 'null', 'undefined', '[object object]'];

/**
 * オブジェクトから空のフィールド（null, undefined, 空文字, 空配列, 特定のマジックワード）を再帰的に削除します。
 */
export function prune(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    const prunedArr = obj.map((v) => prune(v)).filter((v) => v !== undefined && v !== null);
    return prunedArr.length > 0 ? prunedArr : undefined;
  }

  if (typeof obj === 'object' && obj !== null) {
    const newObj: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      const pruned = prune(value);

      if (pruned === undefined || pruned === null) continue;

      if (typeof pruned === 'string') {
        const lower = pruned.toLowerCase().trim();
        if (lower === '' || PRUNE_MAGIC_WORDS.includes(lower)) {
          continue;
        }
      }

      if (Array.isArray(pruned) && pruned.length === 0) continue;

      if (typeof pruned === 'object' && Object.keys(pruned).length === 0) continue;

      newObj[key] = pruned;
    }
    return Object.keys(newObj).length > 0 ? newObj : undefined;
  }

  return obj;
}

/**
 * 日本語ベースのデータに翻訳データを再帰的にマージします。
 * { ja: string } 構造を自動検知して多言語化を拡張します。
 */
export function deepMergeTranslation(base: unknown, translated: unknown, lang: string): unknown {
  // 内部プロセスメタデータはマージ対象外
  if (base === '_reasoning' || base === '_generatorMeta') return base;

  if (!base || typeof base !== 'object') return base;
  if (base instanceof Date) return base;

  if (Array.isArray(base)) {
    const transArray = Array.isArray(translated) ? translated : [];
    return base.map((item, i) => deepMergeTranslation(item, transArray[i], lang));
  }

  const result = { ...base } as Record<string, unknown>;
  const transRecord = (
    translated && typeof translated === 'object' && !Array.isArray(translated) ? translated : {}
  ) as Record<string, unknown>;

  for (const key of Object.keys(result)) {
    // _reasoning等、マージ不要なキーをスキップ
    if (key === '_reasoning' || key === '_generatorMeta') continue;

    const baseVal = result[key];
    const transVal = transRecord[key];

    if (baseVal && typeof baseVal === 'object' && !Array.isArray(baseVal)) {
      // 1. 多言語フィールド { ja: ... } を検知した場合
      if ('ja' in baseVal) {
        const multiObj = { ...baseVal } as Record<string, unknown>;

        // 翻訳データが文字列の場合のみマージ（[object Object]混入防止）
        if (typeof transVal === 'string' && transVal.trim() !== '') {
          const cleanVal = transVal.trim();
          if (!PRUNE_MAGIC_WORDS.includes(cleanVal.toLowerCase())) {
            multiObj[lang] = cleanVal;
            result[key] = multiObj;
          }
        }
      } else {
        // 2. 通常のオブジェクト構造なら再帰的に潜る
        result[key] = deepMergeTranslation(baseVal, transVal, lang);
      }
    }
  }

  return result;
}
