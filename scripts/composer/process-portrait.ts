import dotenv from 'dotenv';

// --- 環境変数の先行ロード ---
// ESモジュールのインポート巻き上げを回避するため、
// 他の自前モジュールを読み込む前に必ず実行する
dotenv.config({ path: '.env.local' });
dotenv.config();

/**
 * 作曲家の肖像画をダウンロード・最適化し、R2にアップロードするスクリプト。
 */
async function main() {
  // 1. 動的インポートにより、環境変数がロードされた後にモジュールを初期化する
  const { PutObjectCommand, HeadObjectCommand } = await import('@aws-sdk/client-s3');
  const { default: sharp } = await import('sharp');
  const { r2Client } = await import('@/infrastructure/storage/r2.client');
  const { getLogger } = await import('@/infrastructure/shared/cli/seeder-utils');

  const logger = getLogger();
  const slug = process.argv[2];
  const imageUrl = process.argv[3];
  const force = process.argv.includes('--force');

  // --- 引数およびバリデーション ---
  if (!slug || !imageUrl) {
    console.error(
      'Usage: pnpm tsx scripts/composer/process-portrait.ts <slug> <image_url> [--force]',
    );
    process.exit(1);
  }

  try {
    new URL(imageUrl);
  } catch {
    logger.error(`無効なURLが指定されました: ${imageUrl}`);
    process.exit(1);
  }

  const bucketName = process.env.R2_BUCKET_NAME;
  const cdnBase = process.env.CDN_BASE_URL || 'https://cdn.preludiolab.com';

  if (!bucketName) {
    logger.error('R2_BUCKET_NAME が環境変数に設定されていません。.env.local を確認してください。');
    process.exit(1);
  }

  const r2PathFull = `public/composers/${slug}/images/portrait.webp`;
  const r2PathSmall = `public/composers/${slug}/images/portrait-sm.webp`;
  const cdnUrlFull = `${cdnBase}/composers/${slug}/images/portrait.webp`;

  try {
    // --- 存在チェックフェーズ ---
    if (!force) {
      try {
        await r2Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: r2PathFull }));
        await r2Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: r2PathSmall }));
        logger.info(
          `${slug} の肖像画は既に存在します。スキップします（再生成する場合は --force を使用してください）。`,
        );
        console.log(`\nRESULT_PATH: ${cdnUrlFull}`);
        return;
      } catch (e: unknown) {
        if (
          e &&
          typeof e === 'object' &&
          'name' in e &&
          e.name !== 'NotFound' &&
          '$metadata' in e &&
          (e.$metadata as Record<string, unknown>).httpStatusCode !== 404
        ) {
          throw e;
        }
      }
    }

    // --- ダウンロードフェーズ ---
    logger.info(`画像をダウンロード中: ${imageUrl}`);
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`画像の取得に失敗しました: ${response.status} ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      throw new Error('取得した画像データが空です。');
    }

    // --- 最適化フェーズ ---
    logger.info('sharpによる画像最適化処理を開始...');

    const optimizedFull = await sharp(buffer)
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    const optimizedSmall = await sharp(buffer)
      .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    // --- アップロードフェーズ ---
    logger.info(`R2（バケット: ${bucketName}）へのアップロードを開始...`);

    await r2Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: r2PathFull,
        Body: optimizedFull,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    logger.info(`アップロード完了: ${r2PathFull}`);

    await r2Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: r2PathSmall,
        Body: optimizedSmall,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    logger.info(`アップロード完了: ${r2PathSmall}`);

    logger.info('全ての処理が正常に完了しました！');
    logger.info(`CDN URL: ${cdnUrlFull}`);
    console.log(`\nRESULT_PATH: ${cdnUrlFull}`);
  } catch (err: unknown) {
    logger.error('肖像画の処理中にエラーが発生しました', err as Error);
    process.exit(1);
  }
}

main();
