import { z } from 'zod';
import { SupportedLanguageSchema } from '../dto/work-detail.dto';

/**
 * WorkPart Translation (Write)
 */
const WorkPartTranslationInputSchema = z.object({
  title: z.string().min(1),
  titlePrefix: z.string().nullable().optional(),
  titleContent: z.string().nullable().optional(),
  titleNickname: z.string().nullable().optional(),
  tempoTranslation: z.string().nullable().optional(),
});

/**
 * WorkPart Input (Write)
 * クライアント側で crypto.randomUUID() により事前採番される。
 */
const WorkPartInputSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
  sortOrder: z.number().min(0),
  type: z.string().min(1),
  isNameStandard: z.boolean(),
  keyTonality: z.string().nullable().optional(),
  tempoText: z.string().nullable().optional(),
  genres: z.array(z.string()).default([]),
  instruments: z.array(z.string()).default([]),
  performanceDifficulty: z.number().min(1).max(5).nullable().optional(),
  translations: z.record(SupportedLanguageSchema, WorkPartTranslationInputSchema),
});

/**
 * Work Translation (Write)
 */
const WorkTranslationInputSchema = z.object({
  title: z.string().min(1),
  titlePrefix: z.string().nullable().optional(),
  titleContent: z.string().nullable().optional(),
  titleNickname: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
});

/**
 * Catalogue Input (Write)
 */
const CatalogueInputSchema = z.object({
  prefix: z.string().optional(),
  number: z.string().optional(),
  sortOrder: z.number().optional(),
  isPrimary: z.boolean().default(false),
});

/**
 * Update Work Detail Command Schema
 * Server Actions の入力バリデーション用。
 * Read用の WorkDetailDto とは明確に分離された Write 専用スキーマ。
 */
export const UpdateWorkDetailCommandSchema = z.object({
  /** 更新対象作品ID (UUID) */
  id: z.string().uuid(),
  /** 作曲家ID (UUID) - Typeahead で選択された値 */
  composerId: z.string(),
  /** 楽曲スラグ */
  slug: z.string().min(1),
  /** 楽観的排他制御トークン */
  updatedAt: z.string().min(1),

  // Metadata
  era: z.string().nullable().optional(),
  instrumentation: z.string().nullable().optional(),
  performanceDifficulty: z.number().min(1).max(5).nullable().optional(),
  compositionYear: z.number().nullable().optional(),
  keyTonality: z.string().nullable().optional(),
  tempoText: z.string().nullable().optional(),
  catalogues: z.array(CatalogueInputSchema).default([]),
  genres: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  instruments: z.array(z.string()).default([]),

  // Multilingual
  translations: z.record(SupportedLanguageSchema, WorkTranslationInputSchema),

  // Parts (Full Replace)
  parts: z.array(WorkPartInputSchema).default([]),
});

export type UpdateWorkDetailCommand = z.infer<typeof UpdateWorkDetailCommandSchema>;
