import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import dotenv from 'dotenv';

dotenv.config();

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_ENDPOINT = process.env.R2_ENDPOINT || `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;

const s3Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || '',
    secretAccessKey: R2_SECRET_ACCESS_KEY || '',
  },
});

const SOURCE_DIR = 'article';
const TARGET_PREFIX = 'private/articles';

async function migrate() {
  const dryRun = process.argv.includes('--dry-run');

  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME) {
    if (!dryRun) {
      console.error('Error: Missing environment variables for R2.');
      process.exit(1);
    }
    console.log('[Dry Run] Environment variables missing, but continuing.');
  }

  console.log(`Searching for MDX files in ${SOURCE_DIR}...`);
  const files = await glob(`${SOURCE_DIR}/**/*.mdx`);
  console.log(`Found ${files.length} files.`);

  for (const file of files) {
    // Expected structure: article/{lang}/{category}/{rest_of_path}.mdx
    const relativePath = path.relative(SOURCE_DIR, file);
    const parts = relativePath.split(path.sep);

    if (parts.length < 3) {
      console.warn(`Skipping file with unusual structure: ${file}`);
      continue;
    }

    const lang = parts[0];
    const category = parts[1];
    const slugParts = parts.slice(2);
    // Remove .mdx from the last part
    const lastPart = slugParts[slugParts.length - 1];
    slugParts[slugParts.length - 1] = lastPart.replace(/\.mdx$/, '');

    const slug = slugParts.join('/');
    const targetKey = `${TARGET_PREFIX}/${category}/${slug}/${lang}.mdx`;

    console.log(`Processing: ${file}`);
    console.log(` -> Target: ${targetKey}`);

    if (dryRun) {
      console.log(` [Dry Run] Would upload ${file} to ${targetKey}`);
      continue;
    }

    try {
      const content = fs.readFileSync(file);
      await s3Client.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET_NAME,
          Key: targetKey,
          Body: content,
          ContentType: 'text/markdown', // or text/mdx
        }),
      );
      console.log(` Successfully uploaded to ${targetKey}`);
    } catch (error) {
      console.error(` Failed to upload ${file}:`, error);
    }
  }
}

migrate().catch(console.error);
