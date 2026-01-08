import { zInt } from '@/shared/validation/zod';
import { SlugSchema } from '../shared/Slug';

// バリデーション用定数
const MAX_URL_LENGTH = 2_048;
const MAX_SECONDS_IN_DAY = 86_400;      // 24時間
const MAX_READING_TIME_SECONDS = 1_800; // 30分
const MIN_YEAR = 1_000;
const MAX_YEAR = 2_999;

/**
 * Article Category
 * コンテンツの分類
 */
export const ArticleCategory = {
    /** 楽曲紹介 (メイン) */
    WORKS: 'works',
    /** 作曲家解説 */
    COMPOSERS: 'composers',
    /** 時代区分 */
    ERAS: 'eras',
    /** ジャンル解説 */
    GENRES: 'genres',
    /** 音楽用語・概念 */
    TERMINOLOGY: 'terminology',
    /** 楽器解説 */
    INSTRUMENTS: 'instruments',
    /** 演奏家・団体 */
    PERFORMERS: 'performers',
    /** 音楽理論・分析 */
    THEORY: 'theory',
    /** 読み物・コラム */
    COLUMNS: 'columns',
    /** 特設シリーズ・特集 */
    SERIES: 'series',
    /** オリジナル楽曲・企画 */
    ORIGINALS: 'originals',
} as const;

export type ArticleCategory = (typeof ArticleCategory)[keyof typeof ArticleCategory];


/**
 * Playback Information
 * 音源再生に関する情報 (記事、譜例等で共有可能)
 */
export const PlaybackSchema = z.object({
    /** 音源ソースの識別子 (YouTube ID等) */
    audioSrc: z.string().min(1).max(MAX_URL_LENGTH),
    /** 演奏者・演奏団体名 */
    performer: z.string().max(255).optional(),
    /** 音源の再生開始位置 (秒) */
    startSeconds: zInt().nonnegative().max(MAX_SECONDS_IN_DAY).optional(),
    /** 音源の再生終了位置 (秒) */
    endSeconds: zInt().nonnegative().max(MAX_SECONDS_IN_DAY).optional(),
});

export type Playback = z.infer<typeof PlaybackSchema>;

/**
 * Impression Dimensions
 * 6軸の印象評価値 (-10 to +10 の整数)
 */
export const ImpressionDimensionsSchema = z.object({
    /** 明るさ (Brightness) */
    brightness: zInt().min(-10).max(10),
    /** 躍動感 (Vibrancy) */
    vibrancy: zInt().min(-10).max(10),
    /** 規模感 (Scale) */
    scale: zInt().min(-10).max(10),
    /** 深み (Depth) */
    depth: zInt().min(-10).max(10),
    /** ドラマ性 (Drama) */
    drama: zInt().min(-10).max(10),
    /** 通俗性・人気度 (Popularity) */
    popularity: zInt().min(-10).max(10),
});

export type ImpressionDimensions = z.infer<typeof ImpressionDimensionsSchema>;

/**
 * Article Metadata
 * 記事のメタデータ (Glossary準拠・具象非依存)
 */
export const ArticleMetadataSchema = z.object({
    // --- Titles & Text ---
    /** 記事の管理用タイトル */
    title: z.string().min(1).max(100),
    /** UI上に表示される正式なタイトル */
    displayTitle: z.string().min(1).max(100),
    /** サムネイル上に表示される短いキャッチコピー */
    catchcopy: z.string().max(50).optional(),
    /** 記事一覧や検索結果に表示される抜粋・概要 */
    excerpt: z.string().max(500).optional(),
    /** URLスラグ (発見・アクセス用) / での階層化を許容 */
    slug: SlugSchema,
    /** 記事カテゴリ (発見・分類用) */
    category: z.nativeEnum(ArticleCategory),

    // --- Musical Attributes ---
    /** 作曲家名 */
    composerName: z.string().min(1).max(100),
    /** 作品名 (例: Symphony No.5) */
    workTitle: z.string().max(100).optional(),
    /** 作品番号・カタログ番号 (例: Op.67, BWV 846, K.334) */
    workCatalogueId: z.string().max(50).optional(),
    /** 楽器編成 (Taxonomy準拠) */
    instrumentations: z.array(z.string().max(20)).max(50).optional(),
    /** 音楽ジャンル (Taxonomy準拠) */
    genre: z.string().max(20).optional(),
    /** 時代区分 (Taxonomy準拠) */
    era: z.string().max(20).optional(),
    /** 作曲者の国籍 (ISOコード等) */
    nationality: z.string().max(10).optional(),
    /** 楽曲の調性 (Taxonomy準拠) */
    key: z.string().max(20).optional(),

    // --- Levels & Difficulty ---
    /** 記事の専門性レベル (1-5) */
    readingLevel: zInt().min(1).max(5).optional(),
    /** 楽曲自体の演奏難易度レベル (1-5) */
    performanceDifficulty: zInt().min(1).max(5).optional(),
    /** トップページ等で優先紹介される「おすすめ記事」フラグ */
    isFeatured: z.boolean().default(false),
    /** 推定読了時間 (秒) */
    readingTimeSeconds: zInt().nonnegative().max(MAX_READING_TIME_SECONDS).default(0),

    // --- Impressions ---
    /** 感性・印象評価の6軸データ */
    impressionDimensions: ImpressionDimensionsSchema.optional(),

    // --- Historical Context ---
    /** 楽曲の作曲年 */
    compositionYear: zInt().min(MIN_YEAR).max(MAX_YEAR).optional(),
    /** 作曲者の誕生年 */
    composerBirthYear: zInt().min(MIN_YEAR).max(MAX_YEAR).optional(),

    // --- Media & Playback (Discovery Support) ---
    /** 記事を代表する音源再生情報 (一覧表示での試聴用) */
    playback: PlaybackSchema.optional(),
    /** コンテンツのサムネイル画像URLまたはパス (一覧・検索結果用) */
    thumbnail: z.string().max(MAX_URL_LENGTH).optional().or(z.literal('')),

    // --- Taxonomy & Search ---
    /** 自由タグのリスト */
    tags: z.array(z.string().max(20)).max(50).default([]),

    // --- Lifecycle (Discovery Context) ---
    /** 
     * 正式な公開日時 (未来日時は予約公開扱い)
     * glossary: ArticleMetadata に移動
     */
    publishedAt: z.coerce.date().nullable().default(null),
});

export type ArticleMetadata = z.infer<typeof ArticleMetadataSchema>;
