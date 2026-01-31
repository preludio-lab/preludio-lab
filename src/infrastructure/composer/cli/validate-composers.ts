import path from 'node:path';
import { listJsonFiles, readJsonFile, getLogger } from '@/infrastructure/shared/cli/seeder-utils';
import { ComposerMasterSchema } from '@/application/composer/master/composer-master.schema';

async function main() {
  const logger = getLogger();
  const dataDir = path.join(process.cwd(), 'data', 'composers');

  // Check for specific file argument
  const argFile = process.argv[2];
  let files: string[];

  if (argFile) {
    const fullPath = path.isAbsolute(argFile) ? argFile : path.join(process.cwd(), argFile);
    files = [fullPath];
  } else {
    logger.info(`Scanning for composer data in: ${dataDir}`);
    files = await listJsonFiles(dataDir);
  }

  let hasError = false;
  logger.info(`Validating ${files.length} composer files...`);

  for (const file of files) {
    try {
      const data = await readJsonFile<unknown>(file);
      const result = ComposerMasterSchema.safeParse(data);

      if (result.success) {
        logger.info(`✅ OK: ${path.basename(file)}`);
      } else {
        logger.error(`❌ FAILED: ${path.basename(file)}`);
        console.error(JSON.stringify(result.error.format(), null, 2));
        hasError = true;
      }
    } catch (err) {
      logger.error(`💥 CRITICAL ERROR reading ${file}:`, err as Error);
      hasError = true;
    }
  }

  if (hasError) {
    logger.error('Validation failed.');
    process.exit(1);
  }

  logger.info('✨ All composers are valid.');
}

main();
