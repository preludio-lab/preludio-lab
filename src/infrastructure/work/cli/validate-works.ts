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

  // 引数で特定のファイルを検証するか、ディレクトリ全体をスキャンするかを決定
  const argFile = process.argv[2];
  let files: string[];

  if (argFile) {
    const fullPath = path.isAbsolute(argFile) ? argFile : path.join(process.cwd(), argFile);
    files = [fullPath];
  } else {
    // 引数がない場合はデフォルトの楽曲ディレクトリを再帰的にスキャン
    logger.info(`Scanning for work data in: ${dataDir}`);
    files = await listJsonFiles(dataDir);
  }

  let hasError = false;
  logger.info(`Validating ${files.length} work files...`);

  // 各ファイルを個別にバリデーション
  for (const file of files) {
    try {
      // JSONファイルを読み込み
      const data = await readJsonFile<unknown>(file);

      // アプリケーション層のマスタースキーマを使用して検証
      const result = WorkMasterSchema.safeParse(data);

      if (result.success) {
        // スキーマ検証成功後、ファイルシステム上の整合性をチェック
        const validatedData = result.data;
        const expectedSlug = path.parse(file).name;

        // ファイル名（スラグ）と中身のスラグが一致していることを保証する
        if (validatedData.slug !== expectedSlug) {
          logger.error(
            `FAILED: ${path.basename(file)} - Slug mismatch (content: ${validatedData.slug}, file: ${expectedSlug})`,
          );
          hasError = true;
          continue;
        }

        logger.info(`OK: ${path.basename(file)}`);
      } else {
        // バリデーションエラー時は詳細なパスと内容を出力
        logger.error(`FAILED: ${path.basename(file)}`);
        console.error(JSON.stringify(result.error.format(), null, 2));
        hasError = true;
      }
    } catch (err) {
      // ファイルの読み込み自体ができない場合のエラー
      logger.error(`CRITICAL ERROR reading ${file}:`, err as Error);
      hasError = true;
    }
  }

  // エラーが1件でもあれば異常終了させる
  if (hasError) {
    logger.error('Validation failed.');
    process.exit(1);
  }

  logger.info('All works are valid.');
}

main();
