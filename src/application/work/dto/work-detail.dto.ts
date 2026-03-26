import { z } from 'zod';

/**
 * Supported Language (Admin UI)
 * 管理画面における7言語対応の型定義。
 * AdminLocale (AdminSidebar.tsx) と同期する。
 */
export const SUPPORTED_LANGUAGES = ['ja', 'en', 'de', 'fr', 'it', 'es', 'zh'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
export const SupportedLanguageSchema = z.enum(SUPPORTED_LANGUAGES);

// --- Work Translation Schema (Read) ---
const WorkTranslationDtoSchema = z
  .object({
    title: z.string(),
    titlePrefix: z.string().nullable(),
    titleContent: z.string().nullable(),
    titleNickname: z.string().nullable(),
    description: z.string().nullable(),
  })
  .strict();

// --- WorkPart Translation Schema (Read) ---
const WorkPartTranslationDtoSchema = z
  .object({
    title: z.string(),
    titlePrefix: z.string().nullable(),
    titleContent: z.string().nullable(),
    titleNickname: z.string().nullable(),
    tempoTranslation: z.string().nullable(),
  })
  .strict();

// --- Catalogue Schema (Read) ---
const CatalogueDtoSchema = z
  .object({
    prefix: z.string().optional(),
    number: z.string().optional(),
    sortOrder: z.number().optional(),
    isPrimary: z.boolean(),
  })
  .strict();

// --- WorkPart Detail DTO ---
export const WorkPartDetailDtoSchema = z
  .object({
    id: z.string().uuid(),
    slug: z.string(),
    sortOrder: z.number(),
    type: z.string(),
    isNameStandard: z.boolean(),
    catalogues: z.array(CatalogueDtoSchema),
    keyTonality: z.string().nullable(),
    tempoText: z.string().nullable(),
    genres: z.array(z.string()),
    instruments: z.array(z.string()),
    performanceDifficulty: z.number().nullable(),
    translations: z.record(SupportedLanguageSchema, WorkPartTranslationDtoSchema),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .strict();

export type WorkPartDetailDto = z.infer<typeof WorkPartDetailDtoSchema>;

// --- Work Detail DTO (Read Only) ---
export const WorkDetailDtoSchema = z
  .object({
    id: z.string().uuid(),
    composerId: z.string(),
    composerSlug: z.string(),
    composerName: z.string(),
    slug: z.string(),
    createdAt: z.string(),
    updatedAt: z.string(),

    // Metadata
    era: z.string().nullable(),
    instrumentation: z.string().nullable(),
    performanceDifficulty: z.number().nullable(),
    compositionYear: z.number().nullable(),
    keyTonality: z.string().nullable(),
    tempoText: z.string().nullable(),
    catalogues: z.array(CatalogueDtoSchema),
    genres: z.array(z.string()),
    tags: z.array(z.string()),
    instruments: z.array(z.string()),

    // Multilingual
    translations: z.record(SupportedLanguageSchema, WorkTranslationDtoSchema),

    // Nested Parts
    parts: z.array(WorkPartDetailDtoSchema),
  })
  .strict();

export type WorkDetailDto = z.infer<typeof WorkDetailDtoSchema>;
