import { ImageLoaderProps } from 'next/image';
import { env } from '@/lib/env';

/**
 * Cloudflare R2 / CDN 用の画像ローダー
 *
 * [仕様]
 * 1. 閾値 640px 以下のリクエストに対して、拡張子の直前に `-sm` サフィックスを付与する。
 *    (例: `portrait.webp` -> `portrait-sm.webp`)
 * 2. SVG 形式、または 640px を超える幅のリクエストはオリジナルを返す。
 * 3. 外部 URL (http...) の場合はそのまま返す。
 * 4. ベース URL は環境変数 `NEXT_PUBLIC_CDN_BASE_URL` から取得する。
 */
export default function cloudflareImageLoader({ src, width }: ImageLoaderProps): string {
  // すでに絶対URLの場合はそのまま返す（外部サイトの画像など）
  if (src.startsWith('http')) {
    return src;
  }

  // CDN のベースURLを取得（末尾のスラッシュを除去して正規化）
  const baseUrl = env.NEXT_PUBLIC_CDN_BASE_URL.replace(/\/$/, '');

  // パスの先頭のスラッシュを処理
  const normalizedPath = src.startsWith('/') ? src : `/${src}`;

  // SVG の場合はベクターデータのため常にオリジナルを返す
  if (normalizedPath.toLowerCase().endsWith('.svg')) {
    return `${baseUrl}${normalizedPath}`;
  }

  // 640px 以下の場合、拡張子の直前に -sm を挿入する
  // 正規表現で最後のドット以降（拡張子）をキャプチャして置換
  if (width <= 640) {
    return `${baseUrl}${normalizedPath.replace(/(\.[a-z0-9]+)$/i, '-sm$1')}`;
  }

  // それ以外はオリジナルを配信
  return `${baseUrl}${normalizedPath}`;
}
