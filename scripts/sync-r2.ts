import { S3Client, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3';
import { consola } from 'consola';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';

dotenv.config({ path: '.env.local' });

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || '';

async function syncR2() {
  consola.info('Starting R2 sync...');

  // 1. List local files
  const publicDir = path.join(process.cwd(), 'public');
  const localFiles: string[] = [];

  function walk(dir: string) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        walk(fullPath);
      } else {
        localFiles.push(fullPath);
      }
    }
  }

  walk(publicDir);

  consola.info(`Found ${localFiles.length} local files.`);

  // 2. Upload each file
  for (const file of localFiles) {
    const relativePath = path.relative(publicDir, file);
    const contentType = mime.lookup(file) || 'application/octet-stream';

    try {
      consola.info(`Uploading: ${relativePath} (${contentType})`);
      const fileBuffer = fs.readFileSync(file);

      await r2Client.send(
        new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: relativePath,
          Body: fileBuffer,
          ContentType: contentType,
        }),
      );
    } catch (e) {
      consola.error(`Failed to upload ${relativePath}:`, e as Error);
    }
  }

  // 3. Optional: Cleanup remote files (not in local)
  const listCommand = new ListObjectsV2Command({
    Bucket: BUCKET_NAME,
  });

  try {
    const response = await r2Client.send(listCommand);
    response.Contents?.forEach((obj) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const key = (obj as any).Key as string;
      if (!fs.existsSync(path.join(publicDir, key))) {
        consola.warn(`Remote file [${key}] is not present locally. Manual cleanup recommended.`);
      }
    });
  } catch (e) {
    consola.error('Failed to list R2 objects:', e as Error);
  }

  consola.success('R2 sync completed.');
}

syncR2().catch((e) => {
  consola.error(e as Error);
  process.exit(1);
});
