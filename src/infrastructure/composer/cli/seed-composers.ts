import path from 'node:path';
import {
  initDb,
  listJsonFiles,
  readJsonFile,
  getLogger,
} from '@/infrastructure/shared/cli/seeder-utils';
import { TursoComposerDataSource } from '@/infrastructure/composer/turso.composer.ds';
import { ComposerRepositoryImpl } from '@/infrastructure/composer/composer.repository';
import { SyncComposersUseCase } from '@/application/composer/usecase/sync-composers.usecase';
import { ComposerMaster } from '@/application/composer/master/composer-master.schema';
import { TursoTransactionManager } from '@/infrastructure/database/turso.transaction-manager';

/**
 * 作曲家マスタデータをデータベースに同期するスクリプト。
 *
 * 使い方:
 *   全件同期: pnpm seed:composers
 *   差分同期: pnpm seed:composers --upsert-json added_files.json --delete-json deleted_files.json
 *   プレビュー: pnpm seed:composers --dry-run
 */
async function main() {
  const logger = getLogger();
  const args = process.argv.slice(2);
  const upsertJsonPath = getArgValue(args, '--upsert-json');
  const deleteJsonPath = getArgValue(args, '--delete-json');
  const dryRun = args.includes('--dry-run');

  const db = initDb();
  const ds = new TursoComposerDataSource(db);
  const repo = new ComposerRepositoryImpl(ds);
  const txManager = new TursoTransactionManager(db);
  const syncUseCase = new SyncComposersUseCase(repo, txManager, logger);

  const dataDir = path.join(process.cwd(), 'data', 'composers');

  try {
    let upsertFiles: string[] = [];
    let deleteSlugs: string[] = [];

    if (upsertJsonPath || deleteJsonPath) {
      // --- インクリメンタル同期モード (Git Diff活用) ---
      logger.info('Running in Incremental Sync mode based on Git changes.');

      if (upsertJsonPath) {
        const list = await readJsonFile<string[]>(upsertJsonPath);
        // 作曲家データのみをフィルタリング (data/composers/**/*.json)
        upsertFiles = list
          .filter((f) => f.startsWith('data/composers/') && f.endsWith('.json'))
          .map((f) => path.join(process.cwd(), f));
      }

      if (deleteJsonPath) {
        const list = await readJsonFile<string[]>(deleteJsonPath);
        // 削除されたファイルのパスからスラグを抽出
        deleteSlugs = list
          .filter((f) => f.startsWith('data/composers/') && f.endsWith('.json'))
          .map((f) => path.basename(f, '.json'));
      }
    } else {
      // --- フル同期モード (ディレクトリ全スキャン) ---
      logger.info(
        'Running in Full Sync mode. DB will be matched exactly with data/composers directory.',
      );
      upsertFiles = await listJsonFiles(dataDir);

      // フル同期時は、DBにあってディレクトリにないものを削除対象とする
      const existingInDb = await repo.findMany({});
      const dbSlugs = existingInDb.map((c) => c.slug);
      const fileSlugs = new Set(upsertFiles.map((f) => path.basename(f, '.json')));
      deleteSlugs = dbSlugs.filter((slug) => !fileSlugs.has(slug));
    }

    logger.info(`Plan: ${upsertFiles.length} upserts, ${deleteSlugs.length} deletes.`);

    if (dryRun) {
      logger.info('Dry-run enabled. No changes will be applied to the database.');
      for (const f of upsertFiles) logger.info(`[DRY-RUN] Upsert: ${path.basename(f)}`);
      for (const s of deleteSlugs) logger.info(`[DRY-RUN] Delete: ${s}`);
      return;
    }

    // データの読み込み
    const upsertList: ComposerMaster[] = [];
    for (const file of upsertFiles) {
      try {
        const data = await readJsonFile<ComposerMaster>(file);
        upsertList.push(data);
      } catch (e) {
        logger.warn(`Failed to read or parse ${file}. Skipping.`, { error: String(e) });
      }
    }

    // ユースケース実行
    await syncUseCase.execute({ upsertList, deleteSlugs });

    logger.info('Composer sync completed successfully.');
  } catch (err) {
    logger.error('Sync failed', err as Error);
    process.exit(1);
  }
}

function getArgValue(args: string[], key: string): string | undefined {
  const index = args.indexOf(key);
  if (index !== -1 && index + 1 < args.length) {
    return args[index + 1];
  }
  return undefined;
}

main();
