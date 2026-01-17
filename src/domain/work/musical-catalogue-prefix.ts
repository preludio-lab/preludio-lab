import { z } from 'zod';

/**
 * Musical Catalogue Prefix (作品番号の接頭辞)
 *
 * 作品を識別するための目録番号（カタログ番号）の接頭辞を定義する Value Object。
 * 表記揺れ（"Op." vs "op." 等）を防ぎ、音楽学的に正しいカテゴリ分けを支える。
 */
export const MusicalCataloguePrefix = {
  // --- 通用的 / 標準的 (Universal / Standard) ---
  /** 作品番号 (Opus) */
  OP: 'op',
  /** 遺作作品番号 (Opus posthumous) */
  OP_POSTH: 'op-posth',
  /** 作品番号なし (Werke ohne Opuszahl) */
  WOO: 'woo',

  // --- 作曲家固有：バロック (Baroque) ---
  /** バッハ作品目録 (BWV: J.S.バッハ) */
  BWV: 'bwv',
  /** リオム番号 (RV: ヴィヴァルディ) */
  RV: 'rv',
  /** ヘンデル作品目録 (HWV) */
  HWV: 'hwv',
  /** テレマン作品目録 (TWV) */
  TWV: 'twv',
  /** ジマーマン番号 (Z.: パーセル) */
  Z: 'z',
  /** ファンナ番号 (F.: ヴィヴァルディ ※RV以前の主要目録) */
  F: 'f',

  // --- 作曲家固有：古典派 (Classical) ---
  /** ケッヘル番号 (K.: モーツァルト) */
  K: 'k',
  /** ケッヘル番号 (KV: ドイツ語表記用) */
  KV: 'kv',
  /** ドイチュ番号 (D: シューベルト) */
  D: 'd',
  /** カークパトリック番号 (Kk.: スカルラッティ) */
  KK: 'kk',
  /** ヴォトケンヌ番号 (Wq.: C.P.E.バッハ) */
  WQ: 'wq',
  /** ヘルム番号 (H.: C.P.E.バッハ) */
  H: 'h',
  /** ジェラール番号 (G.: ボッケリーニ) */
  G: 'g',

  // --- Joseph Haydn: Hoboken-Verzeichnis (Hob.) ---
  /** 交響曲 (Hob. I) */
  HOB_I: 'hob-i',
  /** 序曲 (Hob. Ia) */
  HOB_IA: 'hob-ia',
  /** 4声以上のディヴェルティメント (Hob. II) */
  HOB_II: 'hob-ii',
  /** 弦楽四重奏曲 (Hob. III) */
  HOB_III: 'hob-iii',
  /** 3声のディヴェルティメント (Hob. IV) */
  HOB_IV: 'hob-iv',
  /** 弦楽三重奏曲 (Hob. V) */
  HOB_V: 'hob-v',
  /** 各種の二重奏曲 (Hob. VI) */
  HOB_VI: 'hob-vi',
  /** 協奏曲 (Hob. VII) */
  HOB_VII: 'hob-vii',
  /** 行進曲 (Hob. VIII) */
  HOB_VIII: 'hob-viii',
  /** 舞曲 (Hob. IX) */
  HOB_IX: 'hob-ix',
  /** バリトンのための各種作品 (Hob. X) */
  HOB_X: 'hob-x',
  /** バリトン三重奏曲 (Hob. XI) */
  HOB_XI: 'hob-xi',
  /** バリトン二重奏曲 (Hob. XII) */
  HOB_XII: 'hob-xii',
  /** バリトン協奏曲 (Hob. XIII) */
  HOB_XIII: 'hob-xiii',
  /** 鍵盤楽器を伴うディヴェルティメント (Hob. XIV) */
  HOB_XIV: 'hob-xiv',
  /** ピアノ三重奏曲 (Hob. XV) */
  HOB_XV: 'hob-xv',
  /** 鍵盤二重奏曲 (Hob. XVa) */
  HOB_XVA: 'hob-xva',
  /** 鍵盤ソナタ (Hob. XVI) */
  HOB_XVI: 'hob-xvi',
  /** 鍵盤小品 (Hob. XVII) */
  HOB_XVII: 'hob-xvii',
  /** 鍵盤協奏曲 (Hob. XVIII) */
  HOB_XVIII: 'hob-xviii',
  /** 時計音楽 (Hob. XIX) */
  HOB_XIX: 'hob-xix',
  /** 「最後の7つの言葉」関連作品 (Hob. XX) */
  HOB_XX: 'hob-xx',
  /** オラトリオ (Hob. XXI) */
  HOB_XXI: 'hob-xxi',
  /** ミサ曲 (Hob. XXII) */
  HOB_XXII: 'hob-xxii',
  /** その他の宗教曲 (Hob. XXIII) */
  HOB_XXIII: 'hob-xxiii',
  /** 伴奏付カンタータ/アリア (Hob. XXIV) */
  HOB_XXIV: 'hob-xxiv',
  /** ピアノ伴奏付歌曲 (Hob. XXV) */
  HOB_XXV: 'hob-xxv',
  /** カノン (Hob. XXVI) */
  HOB_XXVI: 'hob-xxvi',
  /** 合唱曲・舞台作品 (Hob. XXvii) */
  HOB_XXVII: 'hob-xxvii',
  /** オペラ (Hob. XXVIII) */
  HOB_XXVIII: 'hob-xxviii',
  /** シングシュピール (Hob. XXIX) */
  HOB_XXIX: 'hob-xxix',
  /** 劇付随音楽 (Hob. XXX) */
  HOB_XXX: 'hob-xxx',
  /** 民謡編曲 (Hob. XXXI) */
  HOB_XXXI: 'hob-xxxi',

  // --- 作曲家固有：ロマン派〜近代 (Romantic & Modern) ---
  /** サール番号 (S.: リスト) */
  S: 's',
  /** ルシュール番号 (L.: ドビュッシー) */
  L: 'l',
  /** マルナ番号 (M.: ラヴェル) */
  M: 'm',
  /** セーレシュ番号 (Sz.: バルトーク) */
  SZ: 'sz',
  /** バルトーク新全集番号 (BB) */
  BB: 'bb',
  /** ブルクハウザー番号 (B.: ドヴォルザーク) */
  B: 'b',

  // --- 特殊・付録 (Special / Supplement) ---
  /** 付録 (Anh.) */
  ANH: 'anh',
  /** ヘス番号 (Hess: ベートーヴェン) */
  HESS: 'hess',

  // --- その他 ---
  /** マスターにない特殊なカタログ */
  CUSTOM: 'custom',
} as const;

export type MusicalCataloguePrefix =
  (typeof MusicalCataloguePrefix)[keyof typeof MusicalCataloguePrefix];

/**
 * Musical Catalogue Prefix Schema
 */
export const MusicalCataloguePrefixSchema = z.enum(
  Object.values(MusicalCataloguePrefix) as [MusicalCataloguePrefix, ...MusicalCataloguePrefix[]],
);
