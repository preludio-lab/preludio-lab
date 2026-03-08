/**
 * YouTubeのURLまたはIDから動画IDのみを抽出します。
 */
export function extractVideoId(src: string): string | null {
  if (!src) return null;

  // すでにID形式（11文字の英数字等）の場合はそのまま返す
  if (/^[a-zA-Z0-9_-]{11}$/.test(src)) {
    return src;
  }

  // URL形式からの抽出
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
 * YouTube サムネイル URL かどうかを判定します。
 */
export function isYoutubeThumbnailUrl(url: string): boolean {
  return url.includes('img.youtube.com') || url.includes('i.ytimg.com');
}

/**
 * YouTube サムネイル URL (img.youtube.com/vi/{id}/...) から動画 ID を抽出します。
 */
export function extractVideoIdFromThumbnailUrl(thumbnailUrl: string): string | null {
  const match = thumbnailUrl.match(
    /(?:img\.youtube\.com|i\.ytimg\.com)\/vi(?:_webp)?\/([a-zA-Z0-9_-]{11})/,
  );
  return match ? match[1] : null;
}
