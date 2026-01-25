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
import { WorkData } from '@/domain/work/work.schema';

async function main() {
  const logger = getLogger();
  const db = initDb();

  // Data Sources
  const composerDS = new TursoComposerDataSource(db);
  const workDS = new TursoWorkDataSource(db);

  // Repositories
  const composerRepo = new ComposerRepositoryImpl(composerDS);
  const workRepo = new WorkRepositoryImpl(workDS, composerDS);
  const workPartRepo = new WorkPartRepositoryImpl(workDS);

  // Use Case
  const createUseCase = new CreateWorkUseCase(workRepo, workPartRepo, composerRepo, logger);
  const updateUseCase = new UpdateWorkUseCase(workRepo, workPartRepo, composerRepo, logger);

  // Path to data
  const dataDir = path.join(process.cwd(), 'data', 'works');
  logger.info(`Scanning for work data in: ${dataDir}`);

  try {
    const files = await listJsonFiles(dataDir);
    logger.info(`Found ${files.length} work files.`);

    for (const file of files) {
      logger.info(`Processing: ${path.basename(file)}`);
      const data = await readJsonFile<WorkData>(file);

      // Resolve composer ID first to check existence
      const composer = await composerRepo.findBySlug(data.composerSlug);
      if (!composer) {
        logger.error(`Composer not found for work: ${data.slug} (composer: ${data.composerSlug})`);
        continue; // Skip this work
      }

      const existingWork = await workRepo.findBySlug(composer.id, data.slug);

      if (existingWork) {
        await updateUseCase.execute(data);
      } else {
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
