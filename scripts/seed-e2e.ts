import { db } from '@/infrastructure/database/turso.client';
import {
  composers,
  works,
  articles,
  articleTranslations,
  composerTranslations,
  workTranslations,
} from '@/infrastructure/database/schema';
import {
  ComposerFixturesSchema,
  WorkFixturesSchema,
  ArticleFixturesSchema,
} from '@/shared/fixtures/gold-set/schema/fixture.schema';
import fs from 'fs';
import path from 'path';
import { logger } from '@/infrastructure/logging'; // Use singleton logger
import { z } from 'zod';

// --- Type Definitions ---
type ComposerFixture = z.infer<typeof ComposerFixturesSchema>;
type WorkFixture = z.infer<typeof WorkFixturesSchema>;
type ArticleFixture = z.infer<typeof ArticleFixturesSchema>;

// --- Helper: Read and Validate JSON ---
function readFixture<T>(filename: string, schema: z.ZodType<T>): T {
  const filePath = path.join(process.cwd(), 'src/shared/fixtures/gold-set/data', filename);
  const rawData = fs.readFileSync(filePath, 'utf-8');
  const json = JSON.parse(rawData);
  return schema.parse(json);
}

async function seed() {
  // SECURITY GUARD: Production Check
  if (process.env.NEXT_PUBLIC_APP_ENV === 'production') {
    logger.error('CRITICAL: Attempted to run E2E seed in PRODUCTION environment. Aborting.');
    process.exit(1);
  }

  logger.info(`Starting E2E Gold Set Seeding (Env: ${process.env.NEXT_PUBLIC_APP_ENV})...`);

  try {
    // 1. Composers
    const composersData = readFixture<ComposerFixture>('composers.json', ComposerFixturesSchema);
    for (const composer of composersData) {
      logger.info(`Upserting Composer: ${composer.slug}`);

      const { translations, ...composerRow } = composer;

      // Upsert Composer
      await db.insert(composers).values(composerRow).onConflictDoUpdate({
        target: composers.id,
        set: composerRow,
      });

      // Upsert Translations
      for (const trans of translations) {
        await db
          .insert(composerTranslations)
          .values({
            id: `${composer.id}-${trans.lang}`, // Deterministic ID for translation
            composerId: composer.id,
            ...trans,
          })
          .onConflictDoUpdate({
            target: composerTranslations.id,
            set: trans,
          });
      }
    }

    // 2. Works
    const worksData = readFixture<WorkFixture>('works.json', WorkFixturesSchema);
    for (const work of worksData) {
      logger.info(`Upserting Work: ${work.slug}`);
      const { translations, catalogues, genre, tags, ...workRow } = work;

      // Transform catalogues to match schema requirements
      const formattedCatalogues = catalogues.map((c, index) => ({
        ...c,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        prefix: c.prefix as any, // Cast to match strict enum in schema
        isPrimary: index === 0,
      }));

      // Upsert Work
      await db
        .insert(works)
        .values({
          ...workRow,
          catalogues: formattedCatalogues,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          genres: genre as any,
          tags,
          instrumentationFlags: {
            isSolo: true,
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
            catalogues: formattedCatalogues,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            genres: genre as any,
            tags,
          },
        });

      for (const trans of translations) {
        await db
          .insert(workTranslations)
          .values({
            id: `${work.id}-${trans.lang}`,
            workId: work.id,
            ...trans,
          })
          .onConflictDoUpdate({
            target: workTranslations.id,
            set: trans,
          });
      }
    }

    // 3. Articles
    const articlesData = readFixture<ArticleFixture>('articles.json', ArticleFixturesSchema);
    for (const article of articlesData) {
      logger.info(`Upserting Article: ${article.slug}`);
      const { translations, ...articleRow } = article;

      await db.insert(articles).values(articleRow).onConflictDoUpdate({
        target: articles.id,
        set: articleRow,
      });

      for (const trans of translations) {
        const { playback, ...transRow } = trans;
        // Construct metadata with playback info
        const metadata = {
          playback: playback ? playback : null,
        };

        await db
          .insert(articleTranslations)
          .values({
            id: `${article.id}-${trans.lang}`,
            articleId: article.id,
            ...transRow,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            metadata: metadata as any,
            // Required fields
            slWorkNicknames: [],
            slGenre: [],
            slInstrumentations: [],
            slSeriesAssignments: [],
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            contentStructure: {} as any,
            slComposerName: 'J.S. Bach',
          })
          .onConflictDoUpdate({
            target: articleTranslations.id,
            set: {
              ...transRow,
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              metadata: metadata as any,
            },
          });
      }
    }

    logger.info('E2E Gold Set Seeding Completed Successfully.');
  } catch (e) {
    logger.error('Seeding failed:', e as Error);
    process.exit(1);
  }
}

seed();
