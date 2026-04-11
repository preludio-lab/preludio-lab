/* eslint-disable no-console */
import { config } from 'dotenv';
config({ path: '.env.local' });

async function verifyR2Fetch() {
  const { FetchScoreSourceUseCase } =
    await import('../src/application/score/fetch-score-source.use-case');
  const { MultiProviderScoreSourceRepository } =
    await import('../src/infrastructure/repositories/score/multi-provider-score-source.repository');

  const repository = new MultiProviderScoreSourceRepository();
  const useCase = new FetchScoreSourceUseCase(repository);

  // K. 466 (Mozart) 1st Movement - Now from R2
  // We need to resolve the work_id first, but for the test we'll use a direct look-up if we have the ID.
  // Based on sync log, K.466 is present.

  const workSlug = 'piano-concerto-no-20';
  const partSlug = '1st-mov';

  console.log(`Verifying R2 fetch for ${workSlug} (${partSlug})...`);

  const { createClient } = await import('@libsql/client');
  const { drizzle } = await import('drizzle-orm/libsql');
  const schema = await import('../src/infrastructure/database/schema');
  const { eq } = await import('drizzle-orm');

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
  const db = drizzle(client, { schema });

  const work = await db.query.works.findFirst({
    where: eq(schema.works.slug, workSlug),
  });

  if (!work) {
    console.error('Work not found in DB');
    return;
  }

  try {
    const result = await useCase.execute({ workId: work.id, partSlug });
    console.log('\n--- SUCCESS ---');
    console.log(`Provider: ${result.source.provider}`);
    console.log(`Format: ${result.source.format}`);
    console.log(`R2 Path: ${result.source.filePath}`);
    console.log(`Content Length: ${result.content.length} chars`);
    console.log('\n--- PREVIEW ---');
    console.log(result.content.substring(0, 100));
    process.exit(0);
  } catch (error) {
    console.error('\n--- FAILED ---');
    console.error(error);
    process.exit(1);
  }
}

verifyR2Fetch().catch(console.error);
