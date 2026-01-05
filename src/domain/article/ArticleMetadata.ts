import { z } from 'zod';
import { MonetizationType, ArticleCategory } from './ArticleConstants';


/**
 * Playback Information
 * 音源再生に関する情報 (記事、譜例等で共有可能)
 */
export const PlaybackSchema = z.object({
    /** 音源ソースの識別子 (YouTube ID等) */
    audioSrc: z.string().min(1),
    /** 演奏者・演奏団体名 */
    performer: z.string().optional(),
    /** 音源の再生開始位置 (秒) */
    startSeconds: z.number().optional(),
    /** 音源の再生終了位置 (秒) */
    endSeconds: z.number().optional(),
});

export type Playback = z.infer<typeof PlaybackSchema>;

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
    /** URLスラグ (発見・アクセス用) */
    slug: z.string().min(1),
    /** 記事カテゴリ (発見・分類用) */
    category: z.nativeEnum(ArticleCategory),

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
    /** トップページ等で優先紹介される「おすすめ記事」フラグ */
    isFeatured: z.boolean().default(false),
    /** 推定読了時間 (秒) */
    readingTimeSeconds: z.number().int().nonnegative().default(0),

    // --- Impressions ---
    /** 感性・印象評価の6軸データ */
    impressionDimensions: ImpressionDimensionsSchema.optional(),

    // --- Historical Context ---
    /** 楽曲の作曲年 */
    compositionYear: z.number().int().optional(),
    /** 作曲者の誕生年 */
    composerBirthYear: z.number().int().optional(),

    // --- Media & Playback (Discovery Support) ---
    /** 記事を代表する音源再生情報 (一覧表示での試聴用) */
    playback: PlaybackSchema.optional(),
    /** コンテンツのサムネイル画像URLまたはパス (一覧・検索結果用) */
    thumbnail: z.string().optional().or(z.literal('')),

    // --- Taxonomy & Search ---
    /** 自由タグのリスト */
    tags: z.array(z.string()).default([]),

    publishedAt: z.coerce.date().nullable().default(null),
});

export type ArticleMetadata = z.infer<typeof ArticleMetadataSchema>;
