/* eslint-disable no-console */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { config } from 'dotenv';
import yaml from 'js-yaml';
import pLimit from 'p-limit';
import { uuidv7 } from 'uuidv7';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq, and } from 'drizzle-orm';
import * as schema from '../src/infrastructure/database/schema';

// Load environment variables
config({ path: '.env.local' });

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL) {
  console.error('Error: TURSO_DATABASE_URL is not defined in .env.local');
  process.exit(1);
}

const client = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

const db = drizzle(client, { schema });

interface ScoreManifest {
  version: number;
  scores: {
    work_slug: string;
    composer_slug: string;
    provider: 'github' | 'r2' | 'musedata';
    repository_owner?: string;
    repository_name?: string;
    commit_hash: string;
    file_path: string;
    format: 'kern' | 'musicxml' | 'mei' | 'mxl';
    work_part_slug: string;
    work_part_number: number;
    work_part_title?: string;
    license?: string;
  }[];
}

async function verifyGithubUrl(
  owner: string,
  repo: string,
  commit: string,
  path: string,
): Promise<boolean> {
  const url = `https://raw.githubusercontent.com/${owner}/${repo}/${commit}/${path}`;
  const token = process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {};

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    const response = await fetch(url, { method: 'HEAD', headers });
    return response.ok;
  } catch (error) {
    console.error(`Failed to verify GitHub URL: ${url}`, error);
    return false;
  }
}

async function verifyMuseDataUrl(path: string): Promise<boolean> {
  const url = `http://old.musedata.org/${path}`;
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch (error) {
    console.error(`Failed to verify MuseData URL: ${url}`, error);
    return false;
  }
}

async function sync() {
  console.log('Starting Score Manifest synchronization...');

  const manifestPath = join(process.cwd(), 'data', 'scores', 'manifest.yaml');
  const manifestContent = readFileSync(manifestPath, 'utf8');
  const manifest = yaml.load(manifestContent) as ScoreManifest;

  console.log(`Version: ${manifest.version}`);
  console.log(`Found ${manifest.scores.length} scores to sync.`);

  const limit = pLimit(5); // Concurrency control
  const processedIds: string[] = [];

  const tasks = manifest.scores.map((score) =>
    limit(async () => {
      console.log(`Processing: ${score.work_slug} (${score.work_part_slug})`);

      // 1. Find work_id
      const work = await db.query.works.findFirst({
        where: eq(schema.works.slug, score.work_slug),
      });

      if (!work) {
        // [CRITICAL] Senior Reviewer's instruction: Stop on slug mismatch
        throw new Error(
          `[ERROR] Work master record not found for slug: ${score.work_slug}. Please sync works first.`,
        );
      }

      // 2. Find work_part_id
      const workPart = await db.query.workParts.findFirst({
        where: and(
          eq(schema.workParts.workId, work.id),
          eq(schema.workParts.slug, score.work_part_slug),
        ),
      });

      if (!workPart) {
        console.warn(
          `[WARN] Work part not found: ${score.work_part_slug} for work: ${score.work_slug}. Proceeding without work_part_id linkage.`,
        );
      }

      // 3. Verify Source URL
      if (score.provider === 'github' && score.repository_owner && score.repository_name) {
        const isValid = await verifyGithubUrl(
          score.repository_owner,
          score.repository_name,
          score.commit_hash,
          score.file_path,
        );
        if (!isValid) {
          console.warn(
            `[INVALID URL] Could not verify source for ${score.work_slug} (GitHub). Check commit hash and path.`,
          );
        }
      } else if (score.provider === 'musedata') {
        const isValid = await verifyMuseDataUrl(score.file_path);
        if (!isValid) {
          console.warn(
            `[INVALID URL] Could not verify source for ${score.work_slug} (MuseData). URL: http://old.musedata.org/${score.file_path}`,
          );
        }
      }

      // 4. UPSERT into score_sources
      const existing = await db.query.scoreSources.findFirst({
        where: and(
          eq(schema.scoreSources.workId, work.id),
          eq(schema.scoreSources.workPartSlug, score.work_part_slug),
          eq(schema.scoreSources.provider, score.provider),
        ),
      });

      const data = {
        workId: work.id,
        workPartId: workPart?.id || null,
        scoreId: null,
        provider: score.provider,
        repositoryOwner: score.repository_owner || null,
        repositoryName: score.repository_name || null,
        commitHash: score.commit_hash,
        filePath: score.file_path,
        format: score.format,
        workPartNumber: score.work_part_number,
        workPartTitle: score.work_part_title || null,
        workPartSlug: score.work_part_slug,
        license: score.license || null,
        updatedAt: new Date().toISOString(),
      };

      let sourceId: string;
      if (existing) {
        await db
          .update(schema.scoreSources)
          .set(data)
          .where(eq(schema.scoreSources.id, existing.id));
        console.log(`[UPDATE] ${score.work_slug} - ${score.work_part_slug}`);
        sourceId = existing.id;
      } else {
        sourceId = uuidv7();
        await db.insert(schema.scoreSources).values({
          id: sourceId,
          ...data,
          createdAt: new Date().toISOString(),
        });
        console.log(`[INSERT] ${score.work_slug} - ${score.work_part_slug}`);
      }
      processedIds.push(sourceId);
    }),
  );

  await Promise.all(tasks);

  // 5. Cleanup Orphans (Records in DB but not in Manifest)
  console.log('Checking for orphaned records...');
  // Using simple array filter for safety in prototype. For large data, use NOT IN query.
  const allExisting = await db.query.scoreSources.findMany();
  const orphans = allExisting.filter((e) => !processedIds.includes(e.id));

  if (orphans.length > 0) {
    console.warn(`[ORPHAN] Found ${orphans.length} records that are no longer in the manifest.`);
    for (const orphan of orphans) {
      await db.delete(schema.scoreSources).where(eq(schema.scoreSources.id, orphan.id));
      console.log(`[DELETE] Orphaned record: ${orphan.workPartSlug} (${orphan.id})`);
    }
  }

  console.log('Synchronization completed successfully.');
  process.exit(0);
}

sync().catch((err) => {
  console.error('Synchronization failed:', err.message || err);
  process.exit(1);
});
