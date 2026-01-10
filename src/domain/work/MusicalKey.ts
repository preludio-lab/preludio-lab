import { z } from 'zod';

/**
 * Musical Key (調性)
 *
 * 西洋音楽における調性および旋律の基礎を定義する Value Object。
 * 10,000記事のフィルタリングや、楽章ごとの分析に使用する。
 */
export const MusicalKey = {
  // --- Major Keys (長調) ---
  /** ハ長調 */
  C_MAJOR: 'c-major',
  /** 嬰ハ長調 */
  C_SHARP_MAJOR: 'c-sharp-major',
  /** 変ニ長調 */
  D_FLAT_MAJOR: 'd-flat-major',
  /** ニ長調 */
  D_MAJOR: 'd-major',
  /** 変ホ長調 */
  E_FLAT_MAJOR: 'e-flat-major',
  /** ホ長調 */
  E_MAJOR: 'e-major',
  /** ヘ長調 */
  F_MAJOR: 'f-major',
  /** 嬰ヘ長調 */
  F_SHARP_MAJOR: 'f-sharp-major',
  /** 変ト長調 */
  G_FLAT_MAJOR: 'g-flat-major',
  /** ト長調 */
  G_MAJOR: 'g-major',
  /** 変イ長調 */
  A_FLAT_MAJOR: 'a-flat-major',
  /** イ長調 */
  A_MAJOR: 'a-major',
  /** 変ロ長調 */
  B_FLAT_MAJOR: 'b-flat-major',
  /** ロ長調 */
  B_MAJOR: 'b-major',
  /** 変ハ長調 */
  C_FLAT_MAJOR: 'c-flat-major',

  // --- Minor Keys (短調) ---
  /** ハ短調 */
  C_MINOR: 'c-minor',
  /** 嬰ハ短調 */
  C_SHARP_MINOR: 'c-sharp-minor',
  /** ニ短調 */
  D_MINOR: 'd-minor',
  /** 嬰ニ短調 */
  D_SHARP_MINOR: 'd-sharp-minor',
  /** 変ホ短調 */
  E_FLAT_MINOR: 'e-flat-minor',
  /** ホ短調 */
  E_MINOR: 'e-minor',
  /** ヘ短調 */
  F_MINOR: 'f-minor',
  /** 嬰ヘ短調 */
  F_SHARP_MINOR: 'f-sharp-minor',
  /** ト短調 */
  G_MINOR: 'g-minor',
  /** 嬰ト短調 */
  G_SHARP_MINOR: 'g-sharp-minor',
  /** イ短調 */
  A_MINOR: 'a-minor',
  /** 嬰イ短調 */
  A_SHARP_MINOR: 'a-sharp-minor',
  /** 変ロ短調 */
  B_FLAT_MINOR: 'b-flat-minor',
  /** ロ短調 */
  B_MINOR: 'b-minor',
  /** 変イ短調 */
  A_FLAT_MINOR: 'a-flat-minor',

  // --- Plain Notes / Modeless (主音のみ / 指定なし) ---
  /** ハ調 (in C) */
  C: 'c',
  /** 嬰ハ調 (in C#) */
  C_SHARP: 'c-sharp',
  /** 変ニ調 (in Db) */
  D_FLAT: 'd-flat',
  /** ニ調 (in D) */
  D: 'd',
  /** 嬰ニ調 (in D#) */
  D_SHARP: 'd-sharp',
  /** 変ホ調 (in Eb) */
  E_FLAT: 'e-flat',
  /** ホ調 (in E) */
  E: 'e',
  /** ヘ調 (in F) */
  F: 'f',
  /** 嬰ヘ調 (in F#) */
  F_SHARP: 'f-sharp',
  /** 変ト調 (in Gb) */
  G_FLAT: 'g-flat',
  /** ト調 (in G) */
  G: 'g',
  /** 嬰ト調 (in G#) */
  G_SHARP: 'g-sharp',
  /** 変イ調 (in Ab) */
  A_FLAT: 'a-flat',
  /** イ調 (in A) */
  A: 'a',
  /** 嬰イ調 (in A#) */
  A_SHARP: 'a-sharp',
  /** 変ロ調 (in Bb) */
  B_FLAT: 'b-flat',
  /** ロ調 (in B) */
  B: 'b',
  /** 変ハ調 (in Cb) */
  C_FLAT: 'c-flat',

  // --- Other ---
  /** 無調 */
  ATONAL: 'atonal',
} as const;

export type MusicalKey = (typeof MusicalKey)[keyof typeof MusicalKey];

/**
 * Musical Key Schema
 */
export const MusicalKeySchema = z.enum(Object.values(MusicalKey) as [MusicalKey, ...MusicalKey[]]);
