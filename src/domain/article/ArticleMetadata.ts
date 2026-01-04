import { z } from 'zod';

/**
 * Impression Dimensions
 * 6軸の印象評価値 (-10 to +10 の整数)
 */
export const ImpressionDimensionsSchema = z.object({
    brightness: z.number().int().min(-10).max(10),
    vibrancy: z.number().int().min(-10).max(10),
    scale: z.number().int().min(-10).max(10),
    depth: z.number().int().min(-10).max(10),
    drama: z.number().int().min(-10).max(10),
    popularity: z.number().int().min(-10).max(10),
});

export type ImpressionDimensions = z.infer<typeof ImpressionDimensionsSchema>;

/**
 * Article Metadata
 * 記事のメタデータ (Glossary準拠・具象非依存)
 */
export const ArticleMetadataSchema = z.object({
    // --- Titles & Text ---
    title: z.string().min(1),
    displayTitle: z.string().min(1),
    catchcopy: z.string().optional(),
    excerpt: z.string().optional(),

    // --- Musical Attributes ---
    composerName: z.string(),
    workTitle: z.string().optional(), // 作品名 (e.g. "Symphony No.5")
    workCatalogueId: z.string().optional(), // 作品番号 (e.g. "Op.67")
    instrumentations: z.array(z.string()).optional(), // 楽器編成
    genre: z.string().optional(),
    era: z.string().optional(),
    nationality: z.string().optional(), // 国・地域 (ISO code etc.)
    key: z.string().optional(), // 調性

    // --- Levels & Difficulty ---
    readingLevel: z.number().int().min(1).max(5).optional(), // 1-5 (専門性)
    performanceDifficulty: z.number().int().min(1).max(5).optional(), // 1-5 (演奏難易度)

    // --- Impressions ---
    impressionDimensions: ImpressionDimensionsSchema.optional(),

    // --- Historical Context ---
    compositionYear: z.number().int().optional(), // 作曲年
    composerBirthYear: z.number().int().optional(), // 作曲者誕生年

    // --- Media & Playback ---
    audioSrc: z.string().optional(),
    artworkSrc: z.string().optional(),
    performer: z.string().optional(),
    startSeconds: z.number().optional(),
    endSeconds: z.number().optional(),

    // --- Taxonomy & Search ---
    tags: z.array(z.string()).default([]),
});

export type ArticleMetadata = z.infer<typeof ArticleMetadataSchema>;
