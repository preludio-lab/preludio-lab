import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  // In build time or CI without env, we might want to skip this or warn.
  // But for runtime, it's critical.
  console.warn('TURSO_DATABASE_URL is not defined. DB connection will fail.');
}

const client = createClient({
  url: url || 'file:local.db', // Fallback for build phase if strictly needed, or just fail.
  authToken,
});

export const db = drizzle(client, { schema });
