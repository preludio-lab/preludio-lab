import { PlayableSource } from '@/domain/player/Player';

/**
 * MediaMetadataService
 * テキストコンテンツ（ABC記譜法など）からメディアメタデータを抽出するインフラストラクチャサービス。
 */
export class MediaMetadataService {
  /**
   * 指定されたフォーマットのテキストコンテンツを解析し、PlayableSource(の一部)を返します。
   * @param content 解析対象のテキスト
   * @param format フォーマット識別子 ('abc' など)
   */
  public parse(content: string, format: string): Partial<PlayableSource> {
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
  private parseAbc(abcContent: string): Partial<PlayableSource> {
    let sourceId: string | undefined;
    const metadata: Record<string, unknown> = {};
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
            metadata.title = value; // metadata内に格納しつつ、ルートのtitleにも入れるか検討だが、PlayableSourceにはtitleがある
            // PlayableSource.title へのマッピングを推奨
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
            // MEMO: PlayableSource.provider にマッピング
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
          case 'audio_platformLabel':
            metadata.platformLabel = value;
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
    const result: Partial<PlayableSource> = {};
    if (sourceId) result.sourceId = sourceId;
    if (startSeconds !== undefined) result.startSeconds = startSeconds;
    if (endSeconds !== undefined) result.endSeconds = endSeconds;

    // Title extraction logic for flat property
    if (typeof metadata.title === 'string') result.title = metadata.title;

    // Provider extraction
    if (typeof metadata.platform === 'string') {
      const p = metadata.platform;
      if (p === 'audio-file') {
        result.provider = 'files';
      } else if (['youtube', 'spotify', 'soundcloud', 'apple-music'].includes(p)) {
        result.provider = p as any;
      } else {
        result.provider = 'other';
      }
    }
    // else if (typeof metadata.platform === 'string') {
    //   // If we add more platforms, handle here
    // }

    if (Object.keys(metadata).length > 0) {
      result.metadata = metadata;
    }

    return result;
  }
}
