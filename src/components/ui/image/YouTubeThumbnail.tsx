'use client';

import { useState, useCallback } from 'react';

/**
 * YouTube CDN のサムネイル解像度。
 * 16:9 アスペクト比を維持するため、maxresdefault (1280x720) および mqdefault (320x180) を使用。
 * hqdefault (480x360) は 4:3 だが、object-fit: cover で安全に処理される。
 */
const THUMBNAIL_QUALITIES = ['maxresdefault', 'mqdefault', 'hqdefault'] as const;

type ThumbnailQuality = (typeof THUMBNAIL_QUALITIES)[number];

/**
 * YouTube CDN の JPEG URL を生成する。
 */
function getJpegUrl(videoId: string, quality: ThumbnailQuality): string {
  return `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`;
}

/**
 * YouTube CDN の WebP URL を生成する。
 * YouTube は vi_webp パスで WebP 形式のサムネイルを提供している。
 */
function getWebpUrl(videoId: string, quality: ThumbnailQuality): string {
  return `https://i.ytimg.com/vi_webp/${videoId}/${quality}.webp`;
}

export interface YouTubeThumbnailProps {
  /**
   * YouTube 動画 ID (11文字の英数字)。
   */
  videoId: string;
  /**
   * 画像の代替テキスト。
   */
  alt: string;
  /**
   * LCP 要素として扱う場合は true を指定。
   * true: loading="eager" + fetchpriority="high"
   * false: loading="lazy" + fetchpriority="low"
   */
  priority?: boolean;
  /**
   * fill モードで使用する場合は true を指定。
   * true: absolute positioning で親要素を埋める。
   * false: 通常のブロック要素として表示。
   */
  fill?: boolean;
  /**
   * レスポンシブ画像の sizes 属性。
   */
  sizes?: string;
  /**
   * 追加の CSS クラス名。
   */
  className?: string;
}

/**
 * YouTubeThumbnail
 *
 * YouTube CDN から直接サムネイルを配信する専用コンポーネント。
 * Vercel の画像最適化コストをゼロに保ちつつ、以下の最適化を実現:
 *
 * - <picture> + <source> による WebP 優先配信 (YouTube CDN vi_webp エンドポイント)
 * - onError による段階的フォールバック: maxresdefault -> mqdefault -> hqdefault
 * - CLS 対策: aspect-ratio: 16/9 + object-fit: cover
 * - LCP 保護: priority prop による loading/fetchpriority の制御
 */
export function YouTubeThumbnail({
  videoId,
  alt,
  priority = false,
  fill = false,
  sizes,
  className = '',
}: YouTubeThumbnailProps) {
  const [qualityIndex, setQualityIndex] = useState(0);
  const currentQuality = THUMBNAIL_QUALITIES[qualityIndex];

  /**
   * 画像ロードエラー時のフォールバック処理。
   * maxresdefault (404) -> mqdefault -> hqdefault の順に段階的にフォールバック。
   */
  const handleError = useCallback(() => {
    setQualityIndex((prev) => {
      const nextIndex = prev + 1;
      if (nextIndex < THUMBNAIL_QUALITIES.length) {
        return nextIndex;
      }
      // 全解像度で失敗した場合はそのまま (リンク切れ表示)
      return prev;
    });
  }, []);

  const fillStyle: React.CSSProperties = fill
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%' }
    : {};

  return (
    <picture>
      <source type="image/webp" srcSet={getWebpUrl(videoId, currentQuality)} sizes={sizes} />
      <img
        src={getJpegUrl(videoId, currentQuality)}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'low'}
        decoding={priority ? 'sync' : 'async'}
        sizes={sizes}
        onError={handleError}
        className={className}
        style={{
          aspectRatio: '16 / 9',
          objectFit: 'cover',
          width: '100%',
          height: '100%',
          ...fillStyle,
        }}
      />
    </picture>
  );
}
