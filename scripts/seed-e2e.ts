import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import {
  ComposerFixturesSchema,
  WorkFixturesSchema,
  ArticleFixturesSchema,
} from '@/shared/fixtures/gold-set/schema/fixture.schema';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { consola } from 'consola';
import { db } from '@/infrastructure/database/turso.client';
import {
  composers,
  composerTranslations,
  works,
  workTranslations,
  articles,
  articleTranslations,
} from '@/infrastructure/database/schema';
import crypto from 'crypto';

// --- Type Definitions ---
// Let Zod infer the types automatically to avoid mismatches
type ComposerFixture = z.infer<typeof ComposerFixturesSchema>;
type WorkFixture = z.infer<typeof WorkFixturesSchema>;
type ArticleFixture = z.infer<typeof ArticleFixturesSchema>;

// --- Helper Functions ---
function readFixture<T extends z.ZodTypeAny>(filename: string, schema: T): z.infer<T> {
  const filePath = path.join(process.cwd(), 'src/shared/fixtures/gold-set/data', filename);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  return schema.parse(data);
}

// --- Main Seeding Logic ---
async function seed() {
  // SECURITY GUARD: Production Check
  if (process.env.NEXT_PUBLIC_APP_ENV === 'production') {
    consola.error('CRITICAL: Attempted to run E2E seed in PRODUCTION environment. Aborting.');
    process.exit(1);
  }

  consola.info(`Starting E2E Gold Set Seeding (Env: ${process.env.NEXT_PUBLIC_APP_ENV})...`);

  try {
    // 1. Composers
    const composersData = readFixture('composers.json', ComposerFixturesSchema) as ComposerFixture;
    for (const composer of composersData) {
      consola.info(`Upserting Composer: ${composer.slug}`);

      const { translations, ...composerRow } = composer;

      await db.insert(composers).values(composerRow).onConflictDoUpdate({
        target: composers.slug,
        set: composerRow,
      });

      for (const trans of translations) {
        await db
          .insert(composerTranslations)
          .values({
            id: crypto.randomUUID(),
            composerId: composerRow.id,
            ...trans,
          })
          .onConflictDoUpdate({
            target: [composerTranslations.composerId, composerTranslations.lang],
            set: trans,
          });
      }
    }

    // 2. Works
    const worksData = readFixture('works.json', WorkFixturesSchema) as WorkFixture;
    for (const work of worksData) {
      consola.info(`Upserting Work: ${work.slug}`);
      const { translations, catalogues, genre, tags, ...workRow } = work;

      // Transform catalogues to match schema requirements
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cataloguesJson = (catalogues || []) as any;

      await db
        .insert(works)
        .values({
          ...workRow,
          catalogues: cataloguesJson,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          genres: (genre || []) as any,
          tags: (tags as string[]) || [], // Explicit cast
          instrumentationFlags: {
            isSolo: false,
            isChamber: false,
            isOrchestral: false,
            hasChorus: false,
            hasVocal: false,
          },
        })
        .onConflictDoUpdate({
          target: works.id,
          set: {
            ...workRow,
            catalogues: cataloguesJson,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            genres: (genre || []) as any,
            tags: (tags as string[]) || [],
          },
        });

      for (const trans of translations) {
        await db
          .insert(workTranslations)
          .values({
            id: crypto.randomUUID(),
            workId: workRow.id,
            ...trans,
          })
          .onConflictDoUpdate({
            target: [workTranslations.workId, workTranslations.lang],
            set: trans,
          });
      }
    }

    // 3. Articles
    const articlesData = readFixture('articles.json', ArticleFixturesSchema) as ArticleFixture;
    for (const article of articlesData) {
      consola.info(`Upserting Article: ${article.slug}`);
      const { translations, ...articleRow } = article;

      await db.insert(articles).values(articleRow).onConflictDoUpdate({
        target: articles.id,
        set: articleRow,
      });

      for (const trans of translations) {
        const { isFeatured, ...transRow } = trans;
        await db
          .insert(articleTranslations)
          .values({
            id: crypto.randomUUID(),
            articleId: articleRow.id,
            isFeatured: isFeatured ?? false,
            ...transRow,
          })
          .onConflictDoUpdate({
            target: [articleTranslations.articleId, articleTranslations.lang],
            set: {
              ...transRow,
              isFeatured: isFeatured ?? false,
            },
          });
      }
    }

    consola.success('E2E Gold Set Seeding Completed Successfully.');
  } catch (e) {
    consola.error('Seeding failed:', e as Error);
    process.exit(1);
  }
}

seed();
