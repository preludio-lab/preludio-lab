import path from 'node:path';
import {
  initDb,
  listJsonFiles,
  readJsonFile,
  getLogger,
} from '@/infrastructure/shared/cli/seeder-utils';
import { TursoComposerDataSource } from '@/infrastructure/composer/turso.composer.ds';
import { ComposerRepositoryImpl } from '@/infrastructure/composer/composer.repository';
import { CreateComposerUseCase } from '@/application/composer/usecase/create-composer.usecase';
import { UpdateComposerUseCase } from '@/application/composer/usecase/update-composer.usecase';
import { ComposerMaster } from '@/application/composer/master/composer-master.schema';

import { TursoTransactionManager } from '@/infrastructure/shared/turso.transaction-manager';

/**
 * 作曲家マスタデータをデータベースに同期するスクリプト。
 *
 * 指定されたファイル、またはディレクトリ内のすべてのJSONファイルを読み込み、
 * データベースへの保存（新規作成または更新）を行います。
 */
async function main() {
  const logger = getLogger();
  const db = initDb();

  // インフラ層のデータソースとリポジトリの初期化
  const ds = new TursoComposerDataSource(db);
  const repo = new ComposerRepositoryImpl(ds);
  const txManager = new TursoTransactionManager(db);

  // アプリケーション層のユースケース初期化
  const createUseCase = new CreateComposerUseCase(repo, txManager, logger);
  const updateUseCase = new UpdateComposerUseCase(repo, txManager, logger);

  // マスタデータが格納されているルートディレクトリ
  const dataDir = path.join(process.cwd(), 'data', 'composers');

  // 引数で特定のファイルが指定されているか確認。あればそのファイルのみを処理
  const argFile = process.argv[2];
  let files: string[];

  if (argFile) {
    const fullPath = path.isAbsolute(argFile) ? argFile : path.join(process.cwd(), argFile);
    logger.info(`Processing single file: ${fullPath}`);
    files = [fullPath];
  } else {
    // 引数がない場合は全件スキャン
    logger.info(`Scanning for composer data in: ${dataDir}`);
    files = await listJsonFiles(dataDir);
  }

  try {
    logger.info(`Found ${files.length} composer files.`);

    for (const file of files) {
      logger.info(`Processing: ${path.basename(file)}`);

      // JSONをComposerMaster型として読み込み
      const data = await readJsonFile<ComposerMaster>(file);

      // 既存データの存在確認（スラグを使用）
      const existing = await repo.findBySlug(data.slug);

      if (existing) {
        // 存在する場合は更新
        await updateUseCase.execute(data);
      } else {
        // 存在しない場合は新規作成
        await createUseCase.execute(data);
      }
    }

    logger.info('Composer seeding completed successfully.');
  } catch (err) {
    logger.error('Seeding failed', err as Error);
    process.exit(1);
  }
}

main();
