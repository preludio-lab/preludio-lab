/* eslint-disable no-console */
import { config } from 'dotenv';
config({ path: '.env.local' });

import { join } from 'node:path';
import { mkdir, writeFile } from 'node:fs/promises';

async function fetchAndSave() {
  const workSlug = process.argv.find((arg) => arg.startsWith('--work='))?.split('=')[1];
  const partSlug = process.argv.find((arg) => arg.startsWith('--part='))?.split('=')[1];

  if (!workSlug || !partSlug) {
    console.error('Usage: pnpm tsx scripts/fetch-score.ts --work=[work-slug] --part=[part-slug]');
    process.exit(1);
  }

  // 環境変数をロードした後に動的インポート
  const { eq } = await import('drizzle-orm');
  const schema = await import('@/infrastructure/database/schema');
  const { db } = await import('@/infrastructure/database/turso.client');
  const { FetchScoreSourceUseCase } =
    await import('@/application/score/fetch-score-source.use-case');
  const { MultiProviderScoreSourceRepository } =
    await import('@/infrastructure/repositories/score/multi-provider-score-source.repository');

  console.log(`\n[STEP 3] Fetching score for ${workSlug} (${partSlug})...`);

  // 1. Resolve workId and composerSlug from DB
  let work;
  try {
    work = await db.query.works.findFirst({
      where: eq(schema.works.slug, workSlug),
      with: {
        composer: true,
      },
    });
  } catch (dbError: unknown) {
    const message = dbError instanceof Error ? dbError.message : String(dbError);
    console.error('\n[DATABASE ERROR]');
    console.error(`Error: ${message}`);
    console.error('Action: TURSO_DATABASE_URL が正しく設定されているか確認してください。');
    process.exit(1);
  }

  if (!work) {
    console.error(`\n[WORK RECORD NOT FOUND] ${workSlug}`);
    console.error('Action: 楽曲のマスター登録（seed-works.ts）が完了しているか確認してください。');
    process.exit(1);
  }

  const composerSlug = work.composer.slug;

  // 2. Initialize UseCase
  const repository = new MultiProviderScoreSourceRepository();
  const useCase = new FetchScoreSourceUseCase(repository);

  try {
    // 3. Execute Fetch
    const result = await useCase.execute({ workId: work.id, partSlug });
    console.log(`Successfully fetched from ${result.source.provider}`);

    // 4. Persistence (Step 4)
    const storageDir = join(process.cwd(), 'storage', 'scores', composerSlug, workSlug);
    const fileName = `${partSlug}.${result.source.format}`;
    const filePath = join(storageDir, fileName);

    await mkdir(storageDir, { recursive: true });
    await writeFile(filePath, result.content, 'utf8');

    console.log(`\n[STEP 4] PERSISTED: ${filePath}`);
    console.log(`Content Length: ${result.content.length} chars`);
    console.log('--- PREVIEW (100 chars) ---');
    console.log(result.content.substring(0, 100).replace(/\n/g, ' '));
    console.log('---------------------------');

    console.log('\n[SUCCESS] Fetch & Persistence completed successfully.');
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('\n[FAILED TO FETCH SCORE]');
    console.error(`Error: ${message}`);

    if (message.includes('404')) {
      console.error('\n[Troubleshooting]');
      console.error(
        '1. マニフェストの repository_owner, repository_name, file_path が正しいか確認してください。',
      );
      console.error('2. commit_hash が対象リポジトリに存在するか確認してください。');
      console.error(
        '3. メタ・リポジトリの場合、パスの指定方法が推測に基づいています。修正してください。',
      );
    } else if (message.includes('Not found')) {
      console.error('\n[Troubleshooting]');
      console.error(
        'マニフェスト情報の同期（scripts/sync-score-manifest.ts）が完了しているか確認してください。',
      );
    }

    process.exit(1);
  }
}

fetchAndSave().catch((err) => {
  console.error('\n[UNEXPECTED ERROR]');
  console.error(err);
  process.exit(1);
});
