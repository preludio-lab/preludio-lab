import { z } from 'zod';
import { createMultilingualStringSchema } from '../i18n/Locale';
import { MonetizationElementSchema } from '../monetization/Monetization';

/**
 * 楽譜フォーマットの定数定義
 */
export const ScoreFormat = {
    /** ABC notation: テキストベースの楽譜表記法。軽量で動的な描画に適している */
    ABC: 'abc',
    /** MusicXML: 楽譜情報の交換のための標準的なXMLフォーマット */
    MUSICXML: 'musicxml',
    /** MEI (Music Encoding Initiative): 学術的な音楽資料の符号化のための高度なフォーマット */
    MEI: 'mei',
} as const;

/**
 * 楽譜フォーマットの型定義
 * レンダラー（Infra層）やコンポーネント（UI層）において、描画ロジックの分岐や
 * プロパティの型定義として広く利用される Public な定義です。
 */
export type ScoreFormatType = (typeof ScoreFormat)[keyof typeof ScoreFormat];

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
    previewUrl: z.string().url().max(2048).optional(),
    /** 楽譜全体の主要フォーマット (混合の場合は省略可) */
    format: z.nativeEnum(ScoreFormat).optional(),
});

export type ScoreMetadata = z.infer<typeof ScoreMetadataSchema>;
