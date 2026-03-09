import { glob } from 'glob';
import fs from 'node:fs/promises';
import path from 'node:path';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client } from '@/infrastructure/storage/r2.client';
import { consola } from 'consola';

const SOURCE_DIR = 'article';
const TARGET_PREFIX = 'private/articles';

async function migrate() {
  const dryRun = process.argv.includes('--dry-run');

  if (!process.env.R2_BUCKET_NAME) {
    if (!dryRun) {
      consola.error('Error: Missing environment variables for R2.');
      process.exit(1);
    }
    consola.info('[Dry Run] Environment variables missing, but continuing.');
  }

  consola.info(`Searching for MDX files in ${SOURCE_DIR}...`);
  const files = await glob(`${SOURCE_DIR}/**/*.mdx`);
  consola.info(`Found ${files.length} files.`);

  for (const file of files) {
    // Expected structure: article/{lang}/{category}/{rest_of_path}.mdx
    const relativePath = path.relative(SOURCE_DIR, file);
    const parts = relativePath.split(path.sep);

    if (parts.length < 3) {
      consola.warn(`Skipping file with unusual structure: ${file}`);
      continue;
    }

    const lang = parts[0];
    const category = parts[1];
    const slugParts = parts.slice(2);
    // Remove .mdx from last part
    const lastPart = slugParts[slugParts.length - 1];
    slugParts[slugParts.length - 1] = path.basename(lastPart, '.mdx');

    const slug = slugParts.join('/');
    const targetKey = `${TARGET_PREFIX}/${category}/${slug}/mdx/${lang}.mdx`;

    consola.info(`Processing: ${file}`);
    consola.info(` -> Target: ${targetKey}`);

    if (dryRun) {
      consola.info(` [Dry Run] Would upload ${file} to ${targetKey}`);
      continue;
    }

    try {
      const content = await fs.readFile(file);
      await r2Client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET_NAME,
          Key: targetKey,
          Body: content,
          ContentType: 'text/markdown', // or text/mdx
        }),
      );
      consola.success(` Successfully uploaded to ${targetKey}`);
    } catch (error) {
      consola.error(` Failed to upload ${file}:`, error);
    }
  }
}

migrate().catch(consola.error);
