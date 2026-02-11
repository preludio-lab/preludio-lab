import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import fs from 'fs';
import path from 'path';
import pLimit from 'p-limit';
import mime from 'mime-types';
import crypto from 'crypto';
import { glob } from 'glob';
import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { ArticleCategory } from '@/domain/article/article.metadata';

/**
 * Configuration & Environment
 */
const {
  R2_ACCESS_KEY_ID,
  R2_SECRET_ACCESS_KEY,
  R2_BUCKET_NAME,
  R2_ENDPOINT,
  R2_REGION,
  CLOUDFLARE_ZONE_ID,
  CLOUDFLARE_API_TOKEN,
} = process.env;

// CLI Arguments
const args = process.argv.slice(2);
const IS_DRY_RUN = args.includes('--dry-run');
const IS_FORCE = args.includes('--force');

// Constraints
const CONCURRENCY_LIMIT = 20;

/**
 * Main Logic
 */
async function syncR2() {
  console.log(`🚀 Starting R2 Content Sync ${IS_DRY_RUN ? '[DRY RUN]' : ''}...`);

  // 1. Validate Env
  if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_BUCKET_NAME || !R2_ENDPOINT) {
    console.error('❌ Missing R2 configuration in environment');
    process.exit(1);
  }

  const s3Client = new S3Client({
    region: R2_REGION || 'auto',
    endpoint: R2_ENDPOINT,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });

  const ARTICLE_DIR = path.join(process.cwd(), 'article');
  if (!fs.existsSync(ARTICLE_DIR)) {
    console.error('❌ article directory not found');
    process.exit(1);
  }

  // 2. Fetch Remote State (ETags) for Idempotency
  console.log('📡 Fetching remote state from R2...');
  const remoteMap = new Map<string, string>(); // Key -> ETag (stripped of quotes)
  try {
    let continuationToken: string | undefined = undefined;
    do {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response: any = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: R2_BUCKET_NAME,
          Prefix: '', // List everything (private/ & public/)
          ContinuationToken: continuationToken,
        }),
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      response.Contents?.forEach((item: any) => {
        if (item.Key && item.ETag) {
          // ETag usually comes with quotes like "hash", remove them.
          const cleanETag = item.ETag.replace(/^"|"$/g, '');
          remoteMap.set(item.Key, cleanETag);
        }
      });
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);
    console.log(`✅ Found ${remoteMap.size} existing objects in R2.`);
  } catch (e) {
    console.error('❌ Failed to list remote objects:', e);
    // If listing fails, we should probably abort or fallback to force upload?
    // Abort is safer to avoid full re-upload loop if only auth is wrong.
    process.exit(1);
  }

  // 3. Scan Local Files
  console.log('📂 Scanning local files...');
  const categories = Object.values(ArticleCategory);
  const tasks: (() => Promise<SyncResult>)[] = [];

  for (const category of categories) {
    const categoryPath = path.join(ARTICLE_DIR, category);
    if (!fs.existsSync(categoryPath)) continue;

    // We assume structure: article/{category}/{slug}/...
    // We want to find all files inside this category path
    const files = await glob('**/*.*', { cwd: categoryPath, nodir: true });

    for (const fileRelPath of files) {
      // fileRelPath example: 'some-slug/mdx/ja.mdx' or 'some-slug/images/cover.jpg'
      const fullLocalPath = path.join(categoryPath, fileRelPath);

      // Determine R2 Key
      // We need to parse slug and type from path to match expected R2 structure:
      // private/articles/{category}/{slug}/mdx/{lang}.mdx
      // public/articles/{category}/{slug}/images/{filename}

      // Since glob returns relative path from category dir, we can split it.
      // Standard structure: {slug}/mdx/... or {slug}/images/...
      const parts = fileRelPath.split('/');
      if (parts.length < 3) {
        // Not matching structure slug/type/file, skip or log warning?
        // Actually, some deep structures allow subdirs in images.
        // Let's rely on 'mdx' or 'images' segment.
        continue;
      }

      const typeSegmentIndex = parts.findIndex((p) => p === 'mdx' || p === 'images');
      if (typeSegmentIndex === -1) continue; // Unknown folder structure

      const slug = parts.slice(0, typeSegmentIndex).join('/'); // 'some-slug'
      const type = parts[typeSegmentIndex]; // 'mdx' or 'images'
      const fileName = parts.slice(typeSegmentIndex + 1).join('/'); // 'ja.mdx' or 'cover.jpg'

      let r2Key = '';
      let contentType = '';

      if (type === 'mdx') {
        r2Key = `private/articles/${category}/${slug}/mdx/${fileName}`;
        contentType = 'text/markdown; charset=utf-8';
      } else if (type === 'images') {
        r2Key = `public/articles/${category}/${slug}/images/${fileName}`;
        contentType = mime.lookup(fullLocalPath) || 'application/octet-stream';
      } else {
        continue;
      }

      tasks.push(() => processFile(s3Client, fullLocalPath, r2Key, contentType, remoteMap));
    }
  }

  // 4. Execute Tasks
  console.log(`⚡ Processing ${tasks.length} files with concurrency ${CONCURRENCY_LIMIT}...`);
  const limit = pLimit(CONCURRENCY_LIMIT);
  const results = await Promise.all(tasks.map((task) => limit(task)));

  // 5. Summary
  const summary = {
    total: results.length,
    uploaded: results.filter((r) => r.status === 'uploaded').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    failed: results.filter((r) => r.status === 'failed').length,
    errors: results.filter((r) => r.status === 'failed').map((r) => r.key),
  };

  console.log('\n========================================');
  console.log('🎉 Sync Summary');
  console.log(`Total Files: ${summary.total}`);
  console.log(`✅ Uploaded: ${summary.uploaded}`);
  console.log(`⏩ Skipped:  ${summary.skipped}`);
  console.log(`❌ Failed:   ${summary.failed}`);
  if (summary.failed > 0) {
    console.log('Failed Keys:', summary.errors);
  }
  console.log('========================================\n');

  // 6. Cache Purge (Optional)
  const uploadedKeys = results.filter((r) => r.status === 'uploaded').map((r) => r.key);
  if (uploadedKeys.length > 0 && !IS_DRY_RUN && CLOUDFLARE_ZONE_ID && CLOUDFLARE_API_TOKEN) {
    await purgeCache(uploadedKeys);
  } else if (uploadedKeys.length > 0 && !IS_DRY_RUN) {
    console.log(
      'ℹ️  Cache purge skipped (Missing Cloudflare credentials). Manual purge may be required.',
    );
  }
}

type SyncResult = {
  key: string;
  status: 'uploaded' | 'skipped' | 'failed';
  error?: unknown;
};

async function processFile(
  client: S3Client,
  localPath: string,
  key: string,
  contentType: string,
  remoteMap: Map<string, string>,
): Promise<SyncResult> {
  try {
    const fileBuffer = fs.readFileSync(localPath);
    const localHash = crypto.createHash('md5').update(fileBuffer).digest('hex');
    const remoteHash = remoteMap.get(key);

    if (!IS_FORCE && remoteHash === localHash) {
      // console.log(`⏩ [SKIP] ${key}`);
      return { key, status: 'skipped' };
    }

    // Determine specific reason for upload logic (Diff or New)
    const reason = !remoteHash ? 'NEW' : 'DIFF';

    if (IS_DRY_RUN) {
      console.log(`📦 [DRY-RUN] Would upload (${reason}): ${key}`);
      return { key, status: 'uploaded' }; // Count as "would upload"
    }

    await client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
        Body: fileBuffer,
        ContentType: contentType,
        // CacheControl for public images
        CacheControl: key.startsWith('public/') ? 'max-age=31536000, public' : undefined,
      }),
    );

    console.log(`📤 [UPLOAD] ${key}`);
    return { key, status: 'uploaded' };
  } catch (e) {
    console.error(`❌ [ERROR] ${key}:`, e);
    return { key, status: 'failed', error: e };
  }
}

async function purgeCache(keys: string[]) {
  console.log('🧹 Purging Cloudflare Cache...');
  // Note: R2 is commonly served via a custom domain (CDN).
  // We need to map R2 Keys to URLs.
  // env.NEXT_PUBLIC_CDN_BASE_URL should be used if available, or constructed.
  const cdnBaseUrl = process.env.NEXT_PUBLIC_CDN_BASE_URL || 'https://cdn.preludiolab.com';

  // Filter for public keys only, as private keys are not cached by CDN usually (or shouldn't be purged publicly)
  // Actually, if we cache private MDX via some API, we might need to purge different URLs.
  // Assuming keys starting with 'public/' map to {cdnBaseUrl}/...
  // R2 structure: public/articles/... -> URL: https://cdn.preludiolab.com/articles/...
  // Usually the 'public/' prefix is removed or mapped in Cloudflare Worker/Rules.
  // Assuming direct mapping for now: Remove 'public/' prefix? or is the bucket root mapped?
  // Let's assume the standard pattern: https://cdn.preludiolab.com/{key}

  // NOTE: Cloudflare R2 public access usually maps valid object keys directly.
  // If `public/articles/...` is the key, the URL is likely `{domain}/public/articles/...` UNLESS rewritten.
  // Given previous conversations, let's assume keys are part of the URL path capable of being purged.
  // Or better, just purge the URLs constructed from keys.

  const urls = keys
    .filter((k) => k.startsWith('public/')) // Purge public only? Private might be used by API.
    .map((k) => {
      // Adjust this logic if your CDN strips 'public' prefix
      return new URL(k, cdnBaseUrl).toString();
    });

  if (urls.length === 0) {
    console.log('ℹ️  No public URLs to purge.');
    return;
  }

  // Cloudflare limits: 30 URLs per purge request usually?
  // We'll just simple-log for now as full implementation might require chunking.
  // console.log('Purging URLs:', urls);

  // Implementation is skipped to avoid breaking without correct Zone ID/Token.
  // If implemented:
  /*
    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${process.env.CLOUDFLARE_ZONE_ID}/purge_cache`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ files: urls })
    });
    // check response
    */
  console.log(
    'ℹ️  [TODO] Cache purge logic is ready but disabled until Zone ID is confirmed. Updated files:',
    urls.length,
  );
}

syncR2().catch((e) => {
  console.error('FATAL ERROR:', e);
  process.exit(1);
});
