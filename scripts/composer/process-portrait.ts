import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import { HeadObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';

/**
 * 作曲家のポートレート画像を処理して R2 にアップロードするスクリプト。
 *
 * 使い方:
 *   pnpm tsx scripts/composer/process-portrait.ts <slug> <image_url> [--force]
 */
async function main() {
  const { default: sharp } = await import('sharp');
  const { r2Client } = await import('@/infrastructure/storage/r2.client');
  const { getLogger } = await import('@/infrastructure/shared/cli/seeder-utils');
  const { consola } = await import('consola');

  const logger = getLogger();
  const slug = process.argv[2];
  const imageUrl = process.argv[3];
  const force = process.argv.includes('--force');

  // --- 引数およびバリデーション ---
  if (!slug || !imageUrl) {
    consola.error(
      'Usage: pnpm tsx scripts/composer/process-portrait.ts <slug> <image_url> [--force]',
    );
    process.exit(1);
  }

  const bucketName = process.env.R2_BUCKET_NAME;
  const cdnBaseUrl = process.env.NEXT_PUBLIC_CDN_BASE_URL;
  if (!bucketName || !cdnBaseUrl) {
    logger.error('R2_BUCKET_NAME または NEXT_PUBLIC_CDN_BASE_URL が設定されていません。');
    process.exit(1);
  }

  const r2PathFull = `public/composers/portraits/${slug}.webp`;
  const r2PathSmall = `public/composers/portraits/${slug}-small.webp`;
  const cdnUrlFull = `${cdnBaseUrl}/composers/portraits/${slug}.webp`;

  // --- 重複チェック ---
  if (!force) {
    try {
      await r2Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: r2PathFull }));
      await r2Client.send(new HeadObjectCommand({ Bucket: bucketName, Key: r2PathSmall }));
      consola.success(
        `${slug} の肖像画は既に存在します。スキップします（再生成する場合は --force を使用してください）。`,
      );
      consola.info(`\nRESULT_PATH: ${cdnUrlFull}`);
      return;
    } catch (e: unknown) {
      if (
        typeof e === 'object' &&
        e !== null &&
        'name' in e &&
        (e as { name: string }).name !== 'NotFound'
      ) {
        logger.error('既存ファイルのチェック中にエラーが発生しました', e as Error);
      }
      // NotFound の場合は続行
    }
  }

  try {
    // --- 画像の取得 ---
    logger.info(`画像を取得中: ${imageUrl}`);
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // --- 画像の変換 (sharp) ---
    logger.info('画像を WebP に変換・リサイズ中...');

    // 1. フルサイズ (max 800px)
    const fullBuffer = await sharp(buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    // 2. サムネイル用 (max 200px)
    const smallBuffer = await sharp(buffer)
      .resize({ width: 200, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // --- R2 へのアップロード ---
    logger.info('R2 にアップロード中...');

    await r2Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: r2PathFull,
        Body: fullBuffer,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000',
      }),
    );
    logger.info(`アップロード完了: ${r2PathFull}`);

    await r2Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: r2PathSmall,
        Body: smallBuffer,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000',
      }),
    );
    logger.info(`アップロード完了: ${r2PathSmall}`);

    consola.success('全ての処理が正常に完了しました！');
    consola.info(`CDN URL: ${cdnUrlFull}`);
    consola.info(`\nRESULT_PATH: ${cdnUrlFull}`);
  } catch (err: unknown) {
    logger.error('肖像画の処理中にエラーが発生しました', err as Error);
    process.exit(1);
  }
}

main();
