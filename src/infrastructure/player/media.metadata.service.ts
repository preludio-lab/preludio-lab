

/**
 * MediaMetadataService
 * テキストコンテンツ（ABC記譜法など）からメディアメタデータを抽出するインフラストラクチャサービス。
 */
export interface ParsedMediaMetadata {
  sourceId?: string;
  startSeconds?: number;
  endSeconds?: number;
  title?: string;
  composerName?: string;
  performer?: string;
  image?: string;
  sourceUrl?: string;
  provider?: string;
  platform?: string; // Metadata field
  platformUrl?: string; // Metadata field
}

/**
 * MediaMetadataService
 * テキストコンテンツ（ABC記譜法など）からメディアメタデータを抽出するインフラストラクチャサービス。
 */
export class MediaMetadataService {
  /**
   * 指定されたフォーマットのテキストコンテンツを解析し、メタデータの一部を返します。
   * @param content 解析対象のテキスト
   * @param format フォーマット識別子 ('abc' など)
   */
  public parse(content: string, format: string): ParsedMediaMetadata {
    if (typeof content !== 'string') {
      return {};
    }

    switch (format.toLowerCase()) {
      case 'abc':
        return this.parseAbc(content);
      default:
        return {};
    }
  }

  /**
   * ABC記法からメタデータを抽出します。
   * %%audio_src, %%audio_title などのカスタムディレクティブを解析します。
   */
  private parseAbc(abcContent: string): ParsedMediaMetadata {
    let sourceId: string | undefined;
    const metadata: Record<string, string | undefined> = {};
    let startSeconds: number | undefined;
    let endSeconds: number | undefined;

    const lines = abcContent.split('\n');

    lines.forEach((line) => {
      const trimmed = line.trim();
      // %% で始まる行をディレクティブとして解析
      if (!trimmed.startsWith('%%')) return;

      // '%%' 接頭辞を削除: %%audio_src -> audio_src
      const content = trimmed.substring(2);

      // 最初の空白で分割
      const parts = content.split(/\s+/);
      const key = parts[0];
      const value = parts.slice(1).join(' ');

      if (key && value) {
        switch (key) {
          case 'audio_src':
            sourceId = value; // videoId or url
            break;
          case 'audio_title':
            metadata.title = value;
            break;
          case 'audio_composer':
            metadata.composerName = value;
            break;
          case 'audio_performer':
            metadata.performer = value;
            break;
          case 'audio_thumbnail':
          case 'audio_artworkSrc':
            metadata.thumbnail = value;
            break;
          case 'audio_platform':
            // 簡易バリデーション
            const p = value.toLowerCase();
            if (
              ['youtube', 'spotify', 'soundcloud', 'apple-music', 'audio-file', 'default'].includes(
                p,
              )
            ) {
              metadata.platform = p;
            }
            break;
          case 'audio_platformUrl':
            metadata.platformUrl = value;
            break;

          case 'audio_startTime':
          case 'audio_startSeconds':
            const start = parseFloat(value);
            if (!isNaN(start)) startSeconds = start;
            break;
          case 'audio_endTime':
          case 'audio_endSeconds':
            const end = parseFloat(value);
            if (!isNaN(end)) endSeconds = end;
            break;
        }
      }
    });

    // 意味のあるデータが含まれる場合のみ返す
    const result: ParsedMediaMetadata = {};
    if (sourceId) result.sourceId = sourceId;
    if (startSeconds !== undefined) result.startSeconds = startSeconds;
    if (endSeconds !== undefined) result.endSeconds = endSeconds;

    // Field mapping
    if (typeof metadata.title === 'string') result.title = metadata.title;
    if (typeof metadata.composerName === 'string') {
      result.composerName = metadata.composerName;
    }
    if (typeof metadata.performer === 'string') {
      result.performer = metadata.performer;
    }
    if (typeof metadata.thumbnail === 'string') {
      result.image = metadata.thumbnail;
    }
    if (typeof metadata.platformUrl === 'string') {
      result.sourceUrl = metadata.platformUrl;
    }

    // Provider extraction
    if (typeof metadata.platform === 'string') {
      const p = metadata.platform;
      if (p === 'audio-file') {
        result.provider = 'audio-file';
      } else if (['youtube', 'spotify', 'soundcloud', 'apple-music'].includes(p)) {
        result.provider = p;
      } else {
        result.provider = 'generic';
      }
    }

    return result;
  }
}
