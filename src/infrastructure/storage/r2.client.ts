import { S3Client } from '@aws-sdk/client-s3';
import { env } from '@/lib/env';
import { APP_ENV } from '@/lib/constants';

const { R2_REGION, R2_ENDPOINT, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY } = env;

const isConfigMissing = !R2_ENDPOINT || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY;

if (isConfigMissing && env.NEXT_PUBLIC_APP_ENV !== APP_ENV.DEVELOPMENT) {
  console.warn(
    '[R2Client] R2 configuration is missing in non-development environment. Storage operations will fail.',
  );
}

export const r2Client = new S3Client({
  region: R2_REGION,
  endpoint: R2_ENDPOINT || 'https://placeholder.r2.cloudflarestorage.com',
  credentials: {
    accessKeyId: R2_ACCESS_KEY_ID || '',
    secretAccessKey: R2_SECRET_ACCESS_KEY || '',
  },
});
