import { z } from 'zod';
import { zInt } from '@/shared/validation/zod';
import { createMultilingualStringSchema } from '../i18n/locale';
import { createSlugSchema } from '../shared/common-metadata';

/**
 * 楽譜データ（記法）フォーマットの定義
 * 譜例のレンダリングに使用される技術的な形式を表す。
 */
export const NotationFormat = {
  /** ABC notation: テキストベースの楽譜表記法。軽量で動的な描画に適している */
  ABC: 'abc',
  /** MusicXML: 楽譜情報の交換のための標準的なXMLフォーマット */
  MUSICXML: 'musicxml',
  /** MEI (Music Encoding Initiative): 学術的な音楽資料の符号化のための高度なフォーマット */
  MEI: 'mei',
} as const;

export type NotationFormat = (typeof NotationFormat)[keyof typeof NotationFormat];

/**
 * 小節範囲の Zod スキーマ
 */
export const MeasureRangeSchema = z.object({
  /** 開始小節 (1以上, 9999以下) */
  startBar: zInt().min(1).max(9999),
  /** 終了小節 (1以上, 9999以下) */
  endBar: zInt().min(1).max(9999),
});

export type MeasureRange = z.infer<typeof MeasureRangeSchema>;

/**
 * MusicalExampleMetadata の Zod スキーマ
 */
export const MusicalExampleMetadataSchema = z.object({
  /** 対象楽曲ID */
  workId: z.string().min(1).max(50),
  /** 出典エディションID (任意) */
  scoreId: z.string().max(50).optional(),
  /** URLスラグ / での階層化を許容 */
  slug: createSlugSchema(50),
  /** データ形式 (ABC/MusicXML) */
  format: z.nativeEnum(NotationFormat),
  /** 楽譜データへのパス (R2内のキーまたは相対パス) */
  notationPath: z.string().min(1).max(1024),
  /** 描画された楽譜イメージへのパス (SVG/PNG等) */
  visualPath: z.string().min(1).max(1024).optional(),
  /** 対象とする小節範囲 */
  measureRange: MeasureRangeSchema.optional(),
  /** キャプション (最大30, 多言語) */
  caption: createMultilingualStringSchema({ max: 30 }).optional(),
});

export type MusicalExampleMetadata = z.infer<typeof MusicalExampleMetadataSchema>;

/**
 * MusicalExampleMetadata の生成
 */
export const createMusicalExampleMetadata = (params: any): MusicalExampleMetadata => {
  return MusicalExampleMetadataSchema.parse(params);
};
