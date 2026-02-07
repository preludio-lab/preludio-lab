import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import pLimit from 'p-limit';
import mime from 'mime-types';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { ArticleCategory } from '@/domain/article/article.metadata';

async function syncR2() {
  console.log('🚀 Starting R2 Content Sync (Stand-alone Logic)...');

  const { R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_ENDPOINT, R2_REGION } =
    process.env;

  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_ENDPOINT) {
    console.error('❌ Missing R2 configuration in environment');
    return;
  }

  const s3Client = new S3Client({
    region: R2_REGION || 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  const limit = pLimit(5);
  const ARTICLE_DIR = path.join(process.cwd(), 'article');

  if (!fs.existsSync(ARTICLE_DIR)) {
    console.error('❌ article directory not found');
    return;
  }

  const categories = fs
    .readdirSync(ARTICLE_DIR)
    .filter((f) => fs.statSync(path.join(ARTICLE_DIR, f)).isDirectory());

  const tasks: Promise<void>[] = [];

  for (const category of categories) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!Object.values(ArticleCategory).includes(category as any)) {
      if (category !== 'ja' && category !== 'en') {
        console.log(`⚠️ Skipping unknown category: ${category}`);
      }
      continue;
    }

    const categoryPath = path.join(ARTICLE_DIR, category);

    // Recursive scan for mdx and images
    syncDirectory(categoryPath, category);
  }

  async function syncDirectory(currentDir: string, category: string) {
    const items = fs.readdirSync(currentDir);

    // Check if this dir is an "article root" (contains mdx or images dir)
    const isArticleRoot = items.includes('mdx') || items.includes('images');

    if (isArticleRoot) {
      const slug = path.relative(path.join(ARTICLE_DIR, category), currentDir).replace(/\\/g, '/');

      // 1. Sync MDX (Private)
      const mdxDir = path.join(currentDir, 'mdx');
      if (fs.existsSync(mdxDir)) {
        const mdxFiles = fs.readdirSync(mdxDir).filter((f) => f.endsWith('.mdx'));
        for (const file of mdxFiles) {
          const lang = file.replace(/\.mdx$/, '');
          const localPath = path.join(mdxDir, file);
          const r2Key = `private/articles/${category}/${slug}/mdx/${lang}.mdx`;

          tasks.push(
            limit(async () => {
              try {
                const body = fs.readFileSync(localPath);
                await s3Client.send(
                  new PutObjectCommand({
                    Bucket: R2_BUCKET_NAME,
                    Key: r2Key,
                    Body: body,
                    ContentType: 'text/markdown',
                  }),
                );
                console.log(`📤 Uploaded MDX: ${r2Key}`);
              } catch (e) {
                console.error(`❌ Failed to upload MDX ${r2Key}:`, e);
              }
            }),
          );
        }
      }

      // 2. Sync Images (Public)
      const imageDir = path.join(currentDir, 'images');
      if (fs.existsSync(imageDir)) {
        const images = fs.readdirSync(imageDir);
        for (const img of images) {
          const localPath = path.join(imageDir, img);
          if (fs.statSync(localPath).isDirectory()) continue;

          const r2Key = `public/articles/${category}/${slug}/images/${img}`;
          const contentType = mime.lookup(localPath) || 'application/octet-stream';

          tasks.push(
            limit(async () => {
              try {
                const body = fs.readFileSync(localPath);
                await s3Client.send(
                  new PutObjectCommand({
                    Bucket: R2_BUCKET_NAME,
                    Key: r2Key,
                    Body: body,
                    ContentType: contentType,
                    CacheControl: 'max-age=31536000, public',
                  }),
                );
                console.log(`🖼️ Uploaded Image: ${r2Key}`);
              } catch (e) {
                console.error(`❌ Failed to upload Image ${r2Key}:`, e);
              }
            }),
          );
        }
      }
    }

    // Always recurse into subdirectories if not an mdx/images folder itself
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      if (fs.statSync(fullPath).isDirectory() && item !== 'mdx' && item !== 'images') {
        await syncDirectory(fullPath, category);
      }
    }
  }

  console.log(`Queued ${tasks.length} initial tasks (Scanning...)...`);
  // Wait for all syncDirectory to complete queuing
  // Since syncDirectory is async and recursive, we need to wait
  // Wait, the current tasks is an array, we can just await the initial call if it's async
  await Promise.all(tasks);
  console.log('✅ R2 Sync Complete.');
}

syncR2().catch(console.error);
