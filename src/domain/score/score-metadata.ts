import { z } from 'zod';
import { createMultilingualStringSchema } from '../i18n/locale';
import { MonetizationElementSchema } from '../monetization/monetization';
import { UrlSchema } from '../shared/common-metadata';

/**
 * 楽譜の出版・提供形態（媒体）の定義
 */
export const ScoreFormat = {
  /** 物理書籍: 紙媒体の楽譜エディション (Urtext, 実用譜等) */
  PHYSICAL: 'physical',
  /** 電子スコア: デジタル配信、PDF、リーダー用データ等 */
  DIGITAL: 'digital',
} as const;

/**
 * 楽譜フォーマットの型定義
 */
export type ScoreFormat = (typeof ScoreFormat)[keyof typeof ScoreFormat];

/**
 * ScoreMetadata
 * 楽譜エディションのメタデータ。
 * 出版社、校訂者、識別コードなどを管理。
 */
export const ScoreMetadataSchema = z.object({
  /** 出版社 (組織または個人) */
  publisher: createMultilingualStringSchema({ max: 20 }).optional(),
  /** 校訂者・監修者 (個人または監修団体) */
  editor: createMultilingualStringSchema({ max: 20 }).optional(),
  /** エディション名 (例: "Urtext", "全音ピアノライブラリー") */
  edition: createMultilingualStringSchema({ max: 20 }).optional(),
  /** ISBNコード */
  isbn: z.string().max(20).optional(),
  /** GTINコード (JAN/EAN/UPC等の国際標準商品識別コード) */
  gtin: z.string().max(20).optional(),
  /** マネタイズ要素のリスト (アフィリエイトリンク等、最大20件) */
  monetizationElements: z.array(MonetizationElementSchema).max(20).default([]),
  /** 閲覧・プレビュー用URL (PDFや外部ビューワー等) */
  previewUrl: UrlSchema.optional(),
  /** 楽譜全体の主要フォーマット (混合の場合は省略可) */
  format: z.nativeEnum(ScoreFormat).optional(),
});

export type ScoreMetadata = z.infer<typeof ScoreMetadataSchema>;
