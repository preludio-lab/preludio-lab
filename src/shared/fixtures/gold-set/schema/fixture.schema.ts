import { z } from 'zod';
import { ArticleCategory } from '@/domain/article/article.metadata';
import { ArticleStatus } from '@/domain/article/article.control';
import { PlaceSchema } from '@/domain/shared/common.metadata';

/**
 * Composer Fixture Schema
 */
export const ComposerFixtureSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  era: z.string().optional(),
  birthDate: z.string().optional(),
  deathDate: z.string().optional(),
  nationalityCode: z.string().optional(),
  representativeInstruments: z.array(z.string()).default([]),
  representativeGenres: z.array(z.string()).default([]),
  places: z.array(PlaceSchema).default([]),
  tags: z.array(z.string()).default([]),
  translations: z.array(
    z.object({
      lang: z.string(),
      fullName: z.string(),
      displayName: z.string(),
      shortName: z.string(),
      biography: z.string().optional(),
    }),
  ),
});

/**
 * Work Fixture Schema
 */
export const WorkFixtureSchema = z.object({
  id: z.string().uuid(),
  composerId: z.string().uuid(),
  slug: z.string(),
  catalogues: z
    .array(
      z.object({
        prefix: z.string(),
        number: z.string(),
        sortOrder: z.number(),
      }),
    )
    .default([]),
  era: z.string().optional(),
  instrumentation: z.string().optional(),
  performanceDifficulty: z.number().int().min(1).max(5).optional(),
  genre: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  translations: z.array(
    z.object({
      lang: z.string(),
      title: z.string(),
      titlePrefix: z.string().optional(),
      titleContent: z.string().optional(),
      titleNickname: z.string().optional(),
      nicknames: z.array(z.string()).default([]),
      description: z.string().optional(),
    }),
  ),
});

/**
 * Article Fixture Schema
 */
export const ArticleFixtureSchema = z.object({
  id: z.string().uuid(),
  workId: z.string().uuid().optional(),
  slug: z.string(),
  category: z.nativeEnum(ArticleCategory),
  isFeatured: z.boolean().default(false),
  readingTimeSeconds: z.number().default(0),
  translations: z.array(
    z.object({
      lang: z.string(),
      title: z.string(),
      displayTitle: z.string(),
      catchcopy: z.string().optional(),
      excerpt: z.string().optional(),
      status: z.nativeEnum(ArticleStatus),
      publishedAt: z.string().optional(), // ISO8601
      isFeatured: z.boolean().default(false),
      slSlug: z.string(),
      slCategory: z.string(),
      // MDX Path is generated in DB, but we need to know where the content file is
      // We assume content file is at src/shared/fixtures/gold-set/content/{lang}/{category}/{slug}.mdx
      // Testing related fields
      playback: z
        .object({
          audioSrc: z.string().url(),
        })
        .optional(),
    }),
  ),
});

// Array Schemas
export const ComposerFixturesSchema = z.array(ComposerFixtureSchema);
export const WorkFixturesSchema = z.array(WorkFixtureSchema);
export const ArticleFixturesSchema = z.array(ArticleFixtureSchema);
