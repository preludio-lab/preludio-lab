import { config } from 'dotenv';
config({ path: '.env.local' });
config();

import { consola } from 'consola';

async function main() {
  consola.info('Running migrations...');

  try {
    const { db } = await import('../src/infrastructure/database/turso.client');
    const { migrate } = await import('drizzle-orm/libsql/migrator');

    // This will run migrations from the ./drizzle folder
    await migrate(db, { migrationsFolder: './drizzle' });
    consola.success('Migrations completed successfully.');
  } catch (error) {
    consola.error('Migration failed:', error);
    process.exit(1);
  }
}

main();
