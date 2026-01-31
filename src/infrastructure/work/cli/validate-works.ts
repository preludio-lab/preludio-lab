import path from 'node:path';
import { listJsonFiles, readJsonFile, getLogger } from '@/infrastructure/shared/cli/seeder-utils';
import { WorkMasterSchema } from '@/application/work/master/work-master.schema';

/**
 * 楽曲マスタデータのバリデーション実行スクリプト。
 *
 * 指定されたファイル、またはディレクトリ内のすべてのJSONファイルが
 * WorkMasterSchemaを満たしているかチェックします。
 * また、ファイル名とコンテンツ内のスラグの整合性も検証します。
 */
async function main() {
  const logger = getLogger();
  const dataDir = path.join(process.cwd(), 'data', 'works');

  // 引数で特定のファイルが指定されているか確認
  const argFile = process.argv[2];
  let files: string[];

  if (argFile) {
    const fullPath = path.isAbsolute(argFile) ? argFile : path.join(process.cwd(), argFile);
    files = [fullPath];
  } else {
    logger.info(`Scanning for work data in: ${dataDir}`);
    files = await listJsonFiles(dataDir);
  }

  let hasError = false;
  logger.info(`Validating ${files.length} work files...`);

  for (const file of files) {
    try {
      const data = await readJsonFile<unknown>(file);
      const result = WorkMasterSchema.safeParse(data);

      if (result.success) {
        // バリデーション済みのデータを使用してスラグとファイル名の整合性を確認
        const validatedData = result.data;
        const expectedSlug = path.parse(file).name;
        if (validatedData.slug !== expectedSlug) {
          logger.error(
            `FAILED: ${path.basename(file)} - Slug mismatch (content: ${validatedData.slug}, file: ${expectedSlug})`,
          );
          hasError = true;
          continue;
        }

        logger.info(`OK: ${path.basename(file)}`);
      } else {
        logger.error(`FAILED: ${path.basename(file)}`);
        console.error(JSON.stringify(result.error.format(), null, 2));
        hasError = true;
      }
    } catch (err) {
      logger.error(`CRITICAL ERROR reading ${file}:`, err as Error);
      hasError = true;
    }
  }

  if (hasError) {
    logger.error('Validation failed.');
    process.exit(1);
  }

  logger.info('All works are valid.');
}

main();
