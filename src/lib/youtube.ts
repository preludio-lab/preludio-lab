/**
 * YouTube サムネイル URL かどうかを判定します。
 */
export function isYoutubeThumbnailUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  try {
    const { hostname } = new URL(url);
    return hostname === 'img.youtube.com' || hostname === 'i.ytimg.com';
  } catch {
    return false;
  }
}

/**
 * YouTube 動画 ID を抽出します。
 */
export function getYoutubeId(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/,
  );
  return match ? match[1] : null;
}

/**
 * YouTubeのURLまたはIDから動画IDのみを抽出します。
 * (master ブランチ互換)
 */
export function extractVideoId(src: string): string | null {
  if (!src) return null;
  if (/^[a-zA-Z0-9_-]{11}$/.test(src)) return src;
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = src.match(regExp);
  return match && match[7].length === 11 ? match[7] : null;
}

/**
 * YouTube動画IDまたはURLから標準的なサムネイルURLを取得します。
 */
export function getStandardThumbnailUrl(videoSrc: string): string {
  const videoId = extractVideoId(videoSrc);
  return videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : '';
}

/**
 * サムネイルURLから動画IDを抽出します。
 */
export function extractVideoIdFromThumbnailUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/\/vi\/([^/]+)\//);
  return match ? match[1] : null;
}
