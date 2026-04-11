import { z } from 'zod';
import { zInt } from '@/shared/validation/zod';
import { createMultilingualStringSchema } from '../i18n/locale';
import { createSlugSchema } from '../shared/common.metadata';

/**
 * 楽譜データ（記法）フォーマットの定義
 * フレーズのレンダリングに使用される技術的な形式を表す。
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
 * PhraseMetadata の Zod スキーマ
 */
export const PhraseMetadataSchema = z.object({
  /** 自身の表示・識別用スラグ (e.g. "1st-theme") */
  slug: createSlugSchema(50),

  /** 作曲家スラグ (DX/論理参照用) */
  composerSlug: z.string().min(1).max(100).optional(),
  /** 対象楽曲スラグ (DX/論理参照用) */
  workSlug: z.string().min(1).max(200).optional(),
  /** 対象楽章・パーツスラグ (DX/論理参照用) */
  workPartSlug: z.string().min(1).max(100).optional(),
  /** 出典エディションスラグ (DX/論理参照用) */
  scoreSlug: z.string().min(1).max(200).optional(),

  /** データ形式 (ABC/MusicXML) */
  format: z.nativeEnum(NotationFormat),
  /** 楽譜データへのパス (R2内のキー。将来的なアップロード対象) */
  notationPath: z.string().min(1).max(1024),
  /** 描画された楽譜イメージへのパス (SVG/PNG等。任意) */
  visualPath: z.string().min(1).max(1024).optional(),
  /** 対象とする小節範囲 (任意) */
  measureRange: MeasureRangeSchema.optional(),
  /** キャプション (多言語。PreludioLabでは日本語 'ja' を必須とする) */
  caption: createMultilingualStringSchema({ max: 50 }).extend({
    ja: z.string().min(1, '日本語のキャプションは必須です').max(50),
  }),
});

export type PhraseMetadata = z.infer<typeof PhraseMetadataSchema>;

/**
 * PhraseMetadata の生成
 */
export const createPhraseMetadata = (params: unknown): PhraseMetadata => {
  return PhraseMetadataSchema.parse(params);
};
