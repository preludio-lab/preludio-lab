import { PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import sharp from 'sharp';
import { r2Client } from '@/infrastructure/storage/r2.client';
import { getLogger } from '@/infrastructure/shared/cli/seeder-utils';

/**
 * 作曲家の肖像画をダウンロード・最適化し、R2にアップロードするスクリプト。
 *
 * @description
 * 1. 指定されたURLから画像をダウンロードします。
 * 2. sharpを使用して、標準サイズ(1600px)とSmallサイズ(300px)の2種類のWebP画像を生成します。
 * 3. 生成した画像をCloudflare R2の所定のパスにアップロードします。
 *
 * @example
 * pnpm tsx scripts/composer/process-portrait.ts <slug> <image_url> [--force]
 */
async function main() {
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

  const bucketName = process.env.R2_BUCKET_NAME || 'preludiolab-storage';
  const cdnBase = process.env.CDN_BASE_URL || 'https://cdn.preludiolab.com';

  const r2PathFull = `public/composers/${slug}/images/portrait.webp`;
  const r2PathSmall = `public/composers/${slug}/images/portrait-sm.webp`;
  const cdnUrlFull = `${cdnBase}/composers/${slug}/images/portrait.webp`;

  try {
    // --- 存在チェックフェーズ ---
    /**
     * すでにR2上に画像が存在するか確認し、存在する場合は処理をスキップします。
     * --force フラグがある場合は強制的に再生成・アップロードを行います。
     */
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
        // NotFound (404) は正常系（未アップロード）として続行
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
    /**
     * 指定されたURLから画像バイナリを取得します。
     */
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
    /**
     * sharpを使用して画像の物理サイズ調整、フォーマット変換(WebP)、品質最適化を行います。
     */
    logger.info('sharpによる画像最適化処理を開始...');

    // 1. 標準/大サイズ (1600px) - ヒーローイメージや高解像度ディスプレイ向け
    const optimizedFull = await sharp(buffer)
      .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 80 })
      .toBuffer();

    // 2. 小サイズ (300px) - モバイル端末のリスト表示やサムネイル向け
    const optimizedSmall = await sharp(buffer)
      .resize(300, 300, { fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    // --- アップロードフェーズ ---
    /**
     * 生成された2つの画像をCloudflare R2にアップロードします。
     * キャッシュ有効期限を長めに設定(1年)し、CDNでのキャッシュ効率を高めます。
     */
    logger.info(`R2へのアップロードを開始...`);

    // 標準サイズのアップロード
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

    // 小サイズのアップロード
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
    if (err && typeof err === 'object' && 'name' in err && err.name === 'NoSuchBucket') {
      logger.error(`バケット "${bucketName}" が見つかりません。R2の設定を確認してください。`);
    }
    process.exit(1);
  }
}

main();
