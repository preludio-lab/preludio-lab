import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import { env } from '@/lib/env';
import { APP_ENV } from '@/lib/constants';
import { serverLogger as logger } from '@/infrastructure/logging/server.logger';

/**
 * Turso / LibSQL Client
 *
 * NEXT_PUBLIC_APP_ENV が production または staging の場合は必須。
 * development の場合は、SQLite (ローカル) モードなどで動作させるため、
 * エラーを投げずに警告のみに留めます。
 */
const { TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, NEXT_PUBLIC_APP_ENV } = env;

const isConfigMissing = !TURSO_DATABASE_URL;

if (isConfigMissing && NEXT_PUBLIC_APP_ENV !== APP_ENV.DEVELOPMENT) {
  logger.warn(
    'TURSO_DATABASE_URL is not defined in non-development environment. Database operations may fail.',
  );
}

const client = createClient({
  url: TURSO_DATABASE_URL || 'file:local.db', // Fallback for development if URL is missing
  authToken: TURSO_AUTH_TOKEN,
});

logger.debug('Turso Client initialized', { url: TURSO_DATABASE_URL || 'file:local.db' });

export const db = drizzle(client, { schema });
