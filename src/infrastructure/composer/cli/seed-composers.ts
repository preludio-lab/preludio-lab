import path from 'node:path';
import {
  initDb,
  listJsonFiles,
  readJsonFile,
  getLogger,
} from '@/infrastructure/shared/cli/seeder-utils';
import { TursoComposerDataSource } from '@/infrastructure/composer/turso.composer.ds';
import { ComposerRepositoryImpl } from '@/infrastructure/composer/composer.repository';
import { UpsertComposerUseCase } from '@/application/composer/usecase/UpsertComposer';
import { ComposerData } from '@/domain/composer/composer.schema';

async function main() {
  const logger = getLogger();
  const db = initDb();

  const ds = new TursoComposerDataSource(db);
  const repo = new ComposerRepositoryImpl(ds);
  const useCase = new UpsertComposerUseCase(repo, logger);

  // Path to data
  const dataDir = path.join(process.cwd(), 'data', 'composers');
  logger.info(`Scanning for composer data in: ${dataDir}`);

  try {
    const files = await listJsonFiles(dataDir);
    logger.info(`Found ${files.length} composer files.`);

    for (const file of files) {
      logger.info(`Processing: ${path.basename(file)}`);
      const data = await readJsonFile<ComposerData>(file);
      await useCase.execute(data);
    }

    logger.info('Composer seeding completed successfully.');
  } catch (err) {
    logger.error('Seeding failed', err as Error);
    process.exit(1);
  }
}

main();
