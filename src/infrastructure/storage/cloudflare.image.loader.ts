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
  const baseUrl = env.NEXT_PUBLIC_CDN_BASE_URL.replace(/\/$/, '');

  // 1. ローカルの静的UIアセット (Vercel配信)
  // "/" から始まるパスは、Next.jsの標準的なルート相対パス指定と見なしてそのまま返す
  if (src.startsWith('/')) {
    return src;
  }

  // 2. 外部URL (すでに絶対URLの場合)
  if (src.startsWith('http')) {
    // もし自社CDNの絶対URLであれば最適化処理へフォールスルーさせる
    if (!src.startsWith(baseUrl)) {
      return src; // YouTube等の外部画像はそのまま
    }
  }

  // 2. CDN配信アセット (Cloudflare R2)
  // 相対パスの場合はCDNベースURLを結合する。
  // 注意: `src` の先頭にスラッシュがある場合は除去して結合する
  const normalizedPath = src.startsWith(baseUrl) ? src : `${baseUrl}/${src.replace(/^\//, '')}`;

  // SVG の場合はベクターデータのため常にオリジナルを返す
  if (normalizedPath.toLowerCase().endsWith('.svg')) {
    return normalizedPath;
  }

  // 640px 以下の場合、拡張子の直前に -sm を挿入する
  if (width <= 640) {
    return normalizedPath.replace(/(\.[a-z0-9]+)$/i, '-sm$1');
  }

  // それ以外はオリジナルを配信
  return normalizedPath;
}
