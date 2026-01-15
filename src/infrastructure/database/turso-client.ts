import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

if (!url) {
  // ビルド時やCIで環境変数がない場合、スキップするか警告を出す可能性があります。
  // しかし、実行時には必須です。
  console.warn('TURSO_DATABASE_URL is not defined. DB connection will fail.');
}

const client = createClient({
  url: url || 'file:local.db', // ビルドフェーズで厳密に必要な場合のフォールバック、または失敗させる。
  authToken,
});

export const db = drizzle(client, { schema });
