import 'dotenv/config'; // Load .env
import { db } from '@/infrastructure/database/turso.client';
import { articles } from '@/infrastructure/database/schema';
import { count } from 'drizzle-orm';

async function checkDb() {
  console.log('Checking Turso DB connection...');
  try {
    const result = await db.select({ count: count() }).from(articles);
    console.log('Total articles in DB:', result[0].count);
  } catch (e) {
    console.error('Failed to connect or query DB:', e);
  }
}

checkDb();
