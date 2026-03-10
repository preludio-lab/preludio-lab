import { db } from '@/infrastructure/database/turso.client';
import { articles } from '@/infrastructure/database/schema';
import { count } from 'drizzle-orm';
import { consola } from 'consola';

async function checkDb() {
  consola.info('Checking Turso DB connection...');
  try {
    const result = await db.select({ count: count() }).from(articles);
    consola.success('Total articles in DB:', result[0].count);
  } catch (e) {
    consola.error('Failed to connect or query DB:', e);
  }
}

checkDb();
