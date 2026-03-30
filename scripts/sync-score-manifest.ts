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
    provider: 'github' | 'r2';
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
    console.error(`Failed to verify URL: ${url}`, error);
    return false;
  }
}

async function sync() {
  console.log('Starting Score Manifest synchronization...');

  const manifestPath = join(process.cwd(), 'data', 'score-manifest.yaml');
  const manifestContent = readFileSync(manifestPath, 'utf8');
  const manifest = yaml.load(manifestContent) as ScoreManifest;

  console.log(`Version: ${manifest.version}`);
  console.log(`Found ${manifest.scores.length} scores to sync.`);

  const limit = pLimit(5); // Concurrency control

  const tasks = manifest.scores.map((score) =>
    limit(async () => {
      console.log(`Processing: ${score.work_slug} (${score.work_part_slug})`);

      // 1. Find work_id
      const work = await db.query.works.findFirst({
        where: eq(schema.works.slug, score.work_slug),
      });

      if (!work) {
        console.warn(`[SKIP] Work not found for slug: ${score.work_slug}`);
        return;
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

      // 3. Verify GitHub URL if applicable
      if (score.provider === 'github' && score.repository_owner && score.repository_name) {
        const isValid = await verifyGithubUrl(
          score.repository_owner,
          score.repository_name,
          score.commit_hash,
          score.file_path,
        );
        if (!isValid) {
          console.warn(
            `[INVALID URL] Could not verify source for ${score.work_slug}. Check commit hash and path.`,
          );
        }
      }

      // 4. UPSERT into score_sources
      // Note: We use idx_score_src_lookup (workId, workPartSlug, provider) as the unique key for upsert
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
        scoreId: null, // Edition linkage can be added later
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

      if (existing) {
        await db
          .update(schema.scoreSources)
          .set(data)
          .where(eq(schema.scoreSources.id, existing.id));
        console.log(`[UPDATE] ${score.work_slug} - ${score.work_part_slug}`);
      } else {
        await db.insert(schema.scoreSources).values({
          id: uuidv7(),
          ...data,
          createdAt: new Date().toISOString(),
        });
        console.log(`[INSERT] ${score.work_slug} - ${score.work_part_slug}`);
      }
    }),
  );

  await Promise.all(tasks);
  console.log('Synchronization completed.');
  process.exit(0);
}

sync().catch((err) => {
  console.error('Synchronization failed:', err);
  process.exit(1);
});
