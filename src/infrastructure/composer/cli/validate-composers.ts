import path from 'node:path';
import { listJsonFiles, readJsonFile, getLogger } from '@/infrastructure/shared/cli/seeder-utils';
import { ComposerMasterSchema } from '@/application/composer/master/composer-master.schema';

/**
 * 作曲家マスタデータのバリデーション実行スクリプト。
 *
 * 指定されたファイル、またはディレクトリ内のすべてのJSONファイルが
 * ComposerMasterSchemaを満たしているかチェックします。
 */
async function main() {
  const logger = getLogger();
  const dataDir = path.join(process.cwd(), 'data', 'composers');

  // 引数で特定のファイルを検証するか、ディレクトリ全体をスキャンするかを決定
  const argFile = process.argv[2];
  let files: string[];

  if (argFile) {
    const fullPath = path.isAbsolute(argFile) ? argFile : path.join(process.cwd(), argFile);
    files = [fullPath];
  } else {
    // 引数がない場合はデフォルトのディレクトリをスキャン
    logger.info(`Scanning for composer data in: ${dataDir}`);
    files = await listJsonFiles(dataDir);
  }

  let hasError = false;
  logger.info(`Validating ${files.length} composer files...`);

  // 各ファイルを個別にバリデーション
  for (const file of files) {
    try {
      // JSONファイルを未知のオブジェクトとして読み込み
      const data = await readJsonFile<unknown>(file);

      // アプリケーション層のマスタースキーマを使用して検証
      // safeParse を使用し、エラー情報を詳細に取得できるようにする
      const result = ComposerMasterSchema.safeParse(data);

      if (result.success) {
        logger.info(`OK: ${path.basename(file)}`);
      } else {
        // バリデーションエラー時はエラー内容をフォーマットして出力
        logger.error(`FAILED: ${path.basename(file)}`);
        console.error(JSON.stringify(result.error.format(), null, 2));
        hasError = true;
      }
    } catch (err) {
      // ファイルの読み込み失敗などの致命的エラー
      logger.error(`CRITICAL ERROR reading ${file}:`, err as Error);
      hasError = true;
    }
  }

  // 1つでもエラーがあれば、プロセスの終了コードを非ゼロにする
  if (hasError) {
    logger.error('Validation failed.');
    process.exit(1);
  }

  logger.info('All composers are valid.');
}

main();
