import { drizzle } from 'drizzle-orm/libsql';
import { createClient } from '@libsql/client';
import * as schema from '@/infrastructure/database/schema';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Logger } from '@/shared/logging/logger';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
dotenv.config();

// Load Env if not loaded (CLI execution might need dotenv)
// Assuming user runs via `tsx` or `dotenv` preloaded.
// But explicit check is good.

export const initDb = () => {
  const url = process.env.TURSO_DATABASE_URL || process.env.DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.DATABASE_AUTH_TOKEN;

  if (!url) {
    throw new Error('TURSO_DATABASE_URL is not set');
  }

  const client = createClient({
    url,
    authToken,
  });

  return drizzle(client, { schema });
};

export const listJsonFiles = async (dir: string): Promise<string[]> => {
  let files: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files = files.concat(await listJsonFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith('.json')) {
      files.push(fullPath);
    }
  }
  return files;
};

export const readJsonFile = async <T>(filePath: string): Promise<T> => {
  const content = await fs.readFile(filePath, 'utf-8');
  return JSON.parse(content) as T;
};

export const getLogger = (): Logger => {
  return {
    debug: (msg, ...args) => console.debug(`[DEBUG] ${msg}`, ...args),
    info: (msg, ...args) => console.info(`[INFO] ${msg}`, ...args),
    warn: (msg, ...args) => console.warn(`[WARN] ${msg}`, ...args),
    error: (msg, ...args) => console.error(`[ERROR] ${msg}`, ...args),
  };
};
