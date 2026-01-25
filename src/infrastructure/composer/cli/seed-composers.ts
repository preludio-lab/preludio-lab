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
import { ComposerData } from '@/domain/composer/composer.schema';

async function main() {
  const logger = getLogger();
  const db = initDb();

  const ds = new TursoComposerDataSource(db);
  const repo = new ComposerRepositoryImpl(ds);
  const createUseCase = new CreateComposerUseCase(repo, logger);
  const updateUseCase = new UpdateComposerUseCase(repo, logger);

  // Path to data
  const dataDir = path.join(process.cwd(), 'data', 'composers');
  logger.info(`Scanning for composer data in: ${dataDir}`);

  try {
    const files = await listJsonFiles(dataDir);
    logger.info(`Found ${files.length} composer files.`);

    for (const file of files) {
      logger.info(`Processing: ${path.basename(file)}`);
      const data = await readJsonFile<ComposerData>(file);

      const existing = await repo.findBySlug(data.slug);

      if (existing) {
        await updateUseCase.execute(data);
      } else {
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
