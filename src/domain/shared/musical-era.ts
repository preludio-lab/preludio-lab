import { z } from '@/shared/validation/zod';

/**
 * Musical Era (時代区分)
 * 音楽史における主要な時代区分。Taxonomy準拠。
 */
export const MusicalEra = {
  /** 中世 (500-1400) */
  MEDIEVAL: 'medieval',
  /** ルネサンス (1400-1600) */
  RENAISSANCE: 'renaissance',
  /** バロック (1600-1750) */
  BAROQUE: 'baroque',
  /** 古典派 (1730-1820) */
  CLASSICAL: 'classical',
  /** 前期ロマン派 (1815-1850) */
  EARLY_ROMANTIC: 'early-romantic',
  /** 中期ロマン派 (1850-1890) */
  MID_ROMANTIC: 'mid-romantic',
  /** 後期ロマン派 / 世紀末 (1890-1914) */
  LATE_ROMANTIC: 'late-romantic',
  /** 印象主義 (1890-1930) */
  IMPRESSIONISM: 'impressionism',
  /** 近代 (1900-1945) */
  MODERN: 'modern',
  /** 現代 (1945-) */
  CONTEMPORARY: 'contemporary',
} as const;

export type MusicalEra = (typeof MusicalEra)[keyof typeof MusicalEra];

export const MusicalEraSchema = z.enum(Object.values(MusicalEra) as [MusicalEra, ...MusicalEra[]]);
