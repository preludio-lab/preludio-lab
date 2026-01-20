import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import dotenv from 'dotenv';

// Load variables in development/script environments
dotenv.config({ path: '.env.local' });
dotenv.config();

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error(
    'TURSO_DATABASE_URL is not defined. Please check your environment variables (.env.local).',
  );
}

const client = createClient({
  url: url,
  authToken,
});

export const db = drizzle(client, { schema });
