import { db } from '../src/infrastructure/database/turso.client';
import { migrate } from 'drizzle-orm/libsql/migrator';
import { consola } from 'consola';

async function main() {
  consola.info('Running migrations...');

  try {
    // This will run migrations from the ./drizzle folder
    await migrate(db, { migrationsFolder: './drizzle' });
    consola.success('Migrations completed successfully.');
  } catch (error) {
    consola.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
