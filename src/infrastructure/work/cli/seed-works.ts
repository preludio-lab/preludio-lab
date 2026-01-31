import path from 'node:path';
import {
  initDb,
  listJsonFiles,
  readJsonFile,
  getLogger,
} from '@/infrastructure/shared/cli/seeder-utils';
import { TursoComposerDataSource } from '@/infrastructure/composer/turso.composer.ds';
import { TursoWorkDataSource } from '@/infrastructure/work/turso.work.ds';
import { ComposerRepositoryImpl } from '@/infrastructure/composer/composer.repository';
import { WorkRepositoryImpl } from '@/infrastructure/work/work.repository';
import { WorkPartRepositoryImpl } from '@/infrastructure/work/work-part.repository';
import { CreateWorkUseCase } from '@/application/work/usecase/create-work.usecase';
import { UpdateWorkUseCase } from '@/application/work/usecase/update-work.usecase';
import { WorkMaster } from '@/application/work/master/work-master.schema';

/**
 * 楽曲マスタデータをデータベースに同期するスクリプト。
 *
 * 指定されたファイル、またはディレクトリ内のすべてのJSONファイルを読み込み、
 * データベースへの保存（新規作成または更新）を行います。
 * 紐付く作曲家の存在チェックも同時に行います。
 */
async function main() {
  const logger = getLogger();
  const db = initDb();

  // インフラ層の各種データソースの初期化
  const composerDS = new TursoComposerDataSource(db);
  const workDS = new TursoWorkDataSource(db);

  // リポジトリの初期化
  const composerRepo = new ComposerRepositoryImpl(composerDS);
  const workRepo = new WorkRepositoryImpl(workDS, composerDS);
  const workPartRepo = new WorkPartRepositoryImpl(workDS);

  // アプリケーション層のユースケース初期化
  const createUseCase = new CreateWorkUseCase(workRepo, workPartRepo, composerRepo, logger);
  const updateUseCase = new UpdateWorkUseCase(workRepo, workPartRepo, composerRepo, logger);

  // 楽曲データが格納されているディレクトリ
  const dataDir = path.join(process.cwd(), 'data', 'works');

  // 引数による単一ファイル処理、または全体スキャン
  const argFile = process.argv[2];
  let files: string[];

  if (argFile) {
    const fullPath = path.isAbsolute(argFile) ? argFile : path.join(process.cwd(), argFile);
    logger.info(`Processing single file: ${fullPath}`);
    files = [fullPath];
  } else {
    logger.info(`Scanning for work data in: ${dataDir}`);
    files = await listJsonFiles(dataDir);
  }

  try {
    logger.info(`Found ${files.length} work files.`);

    for (const file of files) {
      logger.info(`Processing: ${path.basename(file)}`);
      const data = await readJsonFile<WorkMaster>(file);

      // 紐付く作曲家の存在確認
      // 楽曲DBには作曲家IDが必要なため、まずスラグから作曲家を特定する
      const composer = await composerRepo.findBySlug(data.composerSlug);
      if (!composer) {
        logger.error(`Composer not found for work: ${data.slug} (composer: ${data.composerSlug})`);
        continue; // 作曲家が見当たらない楽曲はスキップ
      }

      // 既存楽曲の存在確認（作曲家IDと楽曲スラグの組み合わせ）
      const existingWork = await workRepo.findBySlug(composer.id, data.slug);

      if (existingWork) {
        // 存在する場合は更新ユースケースを実行
        await updateUseCase.execute(data);
      } else {
        // 存在しない場合は新規作成ユースケースを実行
        await createUseCase.execute(data);
      }
    }

    logger.info('Work seeding completed successfully.');
  } catch (err) {
    logger.error('Seeding failed', err as Error);
    process.exit(1);
  }
}

main();
