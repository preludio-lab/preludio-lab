import { S3Client } from '@aws-sdk/client-s3';

const region = process.env.R2_REGION || 'auto';
const endpoint = process.env.R2_ENDPOINT;
const accessKeyId = process.env.R2_ACCESS_KEY_ID;
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

if (!endpoint || !accessKeyId || !secretAccessKey) {
  console.warn('R2 configuration is missing. Storage operations will fail.');
}

export const r2Client = new S3Client({
  region,
  endpoint: endpoint || 'https://placeholder.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
});
