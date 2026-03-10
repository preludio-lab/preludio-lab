import fs from 'node:fs';
import path from 'node:path';
import { getLogger, initDb, listJsonFiles, readJsonFile } from '../../shared/cli/seeder-utils';
import { WorkFixturesSchema } from '@/shared/fixtures/gold-set/schema/fixture.schema';

/**
 * 既存の JSON データのバリデーションを行うスクリプト（作品データ用）。
 */
async function validateWorks() {
  const logger = getLogger();
  const dataDir = path.join(process.cwd(), 'src/shared/fixtures/gold-set/data/works');

  if (!fs.existsSync(dataDir)) {
    logger.error(`Directory not found: ${dataDir}`);
    process.exit(1);
  }

  try {
    initDb(); // Env validation
    const files = await listJsonFiles(dataDir);
    let hasError = false;

    for (const file of files) {
      const data = await readJsonFile(file);
      const result = WorkFixturesSchema.element.safeParse(data);

      if (result.success) {
        logger.info(`OK: ${path.basename(file)}`);
      } else {
        // バリデーションエラー時はエラー内容をログ出力
        logger.error(`FAILED: ${path.basename(file)}`, result.error);
        hasError = true;
      }
    }

    if (hasError) {
      process.exit(1);
    }
    logger.info('Validation completed successfully.');
  } catch (err) {
    logger.error('Unexpected error during validation', err as Error);
    process.exit(1);
  }
}

validateWorks();
