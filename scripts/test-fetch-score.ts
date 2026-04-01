/* eslint-disable no-console */
import { config } from 'dotenv';
config({ path: '.env.local' });

async function testFetch() {
  // 環境変数をロードした後に動的インポート
  const { FetchScoreSourceUseCase } =
    await import('../src/application/score/fetch-score-source.use-case');
  const { GitHubScoreSourceRepository } =
    await import('../src/infrastructure/repositories/score/github-score-source.repository');

  const repository = new GitHubScoreSourceRepository();
  const useCase = new FetchScoreSourceUseCase(repository);

  // K. 331 (Mozart) 1st Movement
  const workId = '019d3df1-f64b-7659-b9ca-a40a30f104f2';
  const partSlug = '1st-mov';

  console.log(`Testing fetch for K.331 (ID: ${workId})...`);

  try {
    const result = await useCase.execute({ workId, partSlug });
    console.log('\n--- SUCCESS ---');
    console.log(`Provider: ${result.source.provider}`);
    console.log(`Path: ${result.source.filePath}`);
    console.log(`Content Length: ${result.content.length} chars`);
    console.log('\n--- FIRST 200 CHARS ---');
    console.log(result.content.substring(0, 200));
    console.log('--- END ---');
  } catch (error: unknown) {
    const isErrorObj = typeof error === 'object' && error !== null;
    const errorMsg = error instanceof Error ? error.message : String(error);
    const isTransient =
      isErrorObj && 'isTransient' in error
        ? (error as { isTransient: unknown }).isTransient
        : undefined;
    const cause = isErrorObj && 'cause' in error ? (error as { cause: unknown }).cause : undefined;

    console.error('\n--- FAILED ---');
    console.error(`Error: ${errorMsg}`);
    console.error(`Is Transient: ${isTransient}`);
    if (cause) {
      console.error('Cause:', cause);
    }
  }
}

testFetch().catch(console.error);
