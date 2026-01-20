import dotenv from 'dotenv';
import path from 'path';

// Load environment variables before any other imports that might use them
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

import { migrate } from 'drizzle-orm/libsql/migrator';
import { db } from '../src/infrastructure/database/turso.client';

async function main() {
  console.log('Running migrations...');

  try {
    // This will run migrations from the ./drizzle folder
    await migrate(db, { migrationsFolder: './drizzle' });
    console.log('Migrations completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
