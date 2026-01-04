import { z } from 'zod';
import { MonetizationType } from './ArticleConstants';

/**
 * 記事生成や楽曲解説に使用した参考文献や一次情報の根拠
 * 用語集: Source Attribution
 */
export const SourceAttributionSchema = z.object({
    /** 出典のタイトル (例: "IMSLP - Symphony No.5 (Beethoven)") */
    title: z.string().min(1),
    /** 出典へのURL */
    url: z.string().url(),
});

export type SourceAttribution = z.infer<typeof SourceAttributionSchema>;

/**
 * 記事に紐付く収益化リンク（アフィリエイト、自社商品等）
 * 用語集: Monetization Element
 */
export const MonetizationElementSchema = z.object({
    /** 収益化要素の種別 (affiliate, shop 等) */
    type: z.nativeEnum(MonetizationType),
    /** ボタンやリンクに表示するラベル (例: "Amazonで楽譜を見る") */
    label: z.string().min(1),
    /** リンク先URL */
    url: z.string().url(),
});

export type MonetizationElement = z.infer<typeof MonetizationElementSchema>;

/**
 * Impression Dimensions
 * 6軸の印象評価値 (-10 to +10 の整数)
 */
export const ImpressionDimensionsSchema = z.object({
    /** 明るさ (Brightness) */
    brightness: z.number().int().min(-10).max(10),
    /** 躍動感 (Vibrancy) */
    vibrancy: z.number().int().min(-10).max(10),
    /** 規模感 (Scale) */
    scale: z.number().int().min(-10).max(10),
    /** 深み (Depth) */
    depth: z.number().int().min(-10).max(10),
    /** ドラマ性 (Drama) */
    drama: z.number().int().min(-10).max(10),
    /** 通俗性・人気度 (Popularity) */
    popularity: z.number().int().min(-10).max(10),
});

export type ImpressionDimensions = z.infer<typeof ImpressionDimensionsSchema>;

/**
 * Article Metadata
 * 記事のメタデータ (Glossary準拠・具象非依存)
 */
export const ArticleMetadataSchema = z.object({
    // --- Titles & Text ---
    /** 記事の管理用タイトル */
    title: z.string().min(1),
    /** UI上に表示される正式なタイトル */
    displayTitle: z.string().min(1),
    /** サムネイル上に表示される短いキャッチコピー */
    catchcopy: z.string().optional(),
    /** 記事一覧や検索結果に表示される抜粋・概要 */
    excerpt: z.string().optional(),

    // --- Musical Attributes ---
    /** 作曲家名 */
    composerName: z.string(),
    /** 作品名 (例: Symphony No.5) */
    workTitle: z.string().optional(),
    /** 作品番号・カタログ番号 (例: Op.67, BWV 846, K.334) */
    workCatalogueId: z.string().optional(),
    /** 楽器編成 (Taxonomy準拠) */
    instrumentations: z.array(z.string()).optional(),
    /** 音楽ジャンル (Taxonomy準拠) */
    genre: z.string().optional(),
    /** 時代区分 (Taxonomy準拠) */
    era: z.string().optional(),
    /** 作曲者の国籍 (ISOコード等) */
    nationality: z.string().optional(),
    /** 楽曲の調性 (Taxonomy準拠) */
    key: z.string().optional(),

    // --- Levels & Difficulty ---
    /** 記事の専門性レベル (1-5) */
    readingLevel: z.number().int().min(1).max(5).optional(),
    /** 楽曲自体の演奏難易度レベル (1-5) */
    performanceDifficulty: z.number().int().min(1).max(5).optional(),

    // --- Impressions ---
    /** 感性・印象評価の6軸データ */
    impressionDimensions: ImpressionDimensionsSchema.optional(),

    // --- Historical Context ---
    /** 楽曲の作曲年 */
    compositionYear: z.number().int().optional(),
    /** 作曲者の誕生年 */
    composerBirthYear: z.number().int().optional(),

    // --- Media & Playback ---
    /** 音源ソースの識別子 (YouTube ID等) */
    audioSrc: z.string().optional(),
    /** コンテンツのサムネイル画像URL */
    thumbnail: z.string().url().optional().or(z.literal('')),
    /** 演奏者・演奏団体名 */
    performer: z.string().optional(),
    /** 音源の再生開始位置 (秒) */
    startSeconds: z.number().optional(),
    /** 音源の再生終了位置 (秒) */
    endSeconds: z.number().optional(),

    // --- Taxonomy & Search ---
    /** 自由タグのリスト */
    tags: z.array(z.string()).default([]),

    // --- Grounding & Monetization ---
    /** 記事の信頼性を担保する参照リンクのリスト */
    sourceAttributions: z.array(SourceAttributionSchema).optional().default([]),
    /** 収益化リンクのリスト */
    monetizationElements: z.array(MonetizationElementSchema).optional().default([]),
});

export type ArticleMetadata = z.infer<typeof ArticleMetadataSchema>;
