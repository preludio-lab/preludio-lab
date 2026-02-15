import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

async function globalSetup() {
  console.log('Starting Global Setup for E2E...');

  const dbPath = path.join(process.cwd(), 'local-e2e.db');

  // 1. Clean existing DB
  if (fs.existsSync(dbPath)) {
    console.log(`Deleting existing DB: ${dbPath}`);
    fs.unlinkSync(dbPath);
  }

  // 2. Set Env for Setup
  const env = {
    ...process.env,
    TURSO_DATABASE_URL: `file://${dbPath}`,
    NEXT_PUBLIC_APP_ENV: 'test', // or development, essential to allow local db fallback
    SKIP_ENV_VALIDATION: 'true',
  };

  try {
    // 3. Migrate Schema (Using Drizzle Kit Push for speed in test)
    console.log('Pushing schema to local-e2e.db...');
    // We can use drizzle-kit push or run migrations.
    // Since we want schema/index.ts to be reflected:
    execSync('pnpm db:generate', { stdio: 'inherit', env });
    execSync('pnpm db:migrate', { stdio: 'inherit', env });

    // 4. Run Seeding
    console.log('Running Gold Set Seed...');
    // Execute seed-e2e.ts using tsx
    execSync('npx tsx scripts/seed-e2e.ts', { stdio: 'inherit', env });

    console.log('Global Setup Complete.');
  } catch (error) {
    console.error('Global Setup Failed:', error);
    throw error;
  }
}

export default globalSetup;
