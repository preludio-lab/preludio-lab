import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { consola } from 'consola';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';

dotenv.config({ path: '.env.local' });

const r2Client = new S3Client({
  region: process.env.R2_REGION || 'auto',
  endpoint: process.env.R2_ENDPOINT || '',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const BUCKET_NAME = process.env.R2_BUCKET_NAME || '';

async function syncR2() {
  consola.info('Starting R2 sync...');

  const syncTargets = [
    {
      localDir: path.join(process.cwd(), 'public'),
      r2Prefix: 'public/',
    },
    {
      localDir: path.join(process.cwd(), 'storage', 'scores'),
      r2Prefix: 'private/scores/',
    },
  ];

  for (const target of syncTargets) {
    const { localDir, r2Prefix } = target;

    if (!fs.existsSync(localDir)) {
      consola.warn(`Directory not found, skipping: ${localDir}`);
      continue;
    }

    consola.info(`Syncing [${localDir}] to R2 [${r2Prefix}]...`);

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

    walk(localDir);
    consola.info(`Found ${localFiles.length} files in ${localDir}.`);

    // 2. Upload each file
    for (const file of localFiles) {
      const relativePath = path.relative(localDir, file);
      const r2Key = `${r2Prefix}${relativePath}`;
      const contentType = mime.lookup(file) || 'application/octet-stream';

      try {
        consola.info(`Uploading: ${r2Key} (${contentType})`);
        const fileBuffer = fs.readFileSync(file);

        await r2Client.send(
          new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: r2Key,
            Body: fileBuffer,
            ContentType: contentType,
          }),
        );
      } catch (e) {
        consola.error(`Failed to upload ${r2Key}:`, e as Error);
      }
    }
  }

  consola.success('R2 sync completed.');
}

syncR2().catch((e) => {
  consola.error(e as Error);
  process.exit(1);
});
