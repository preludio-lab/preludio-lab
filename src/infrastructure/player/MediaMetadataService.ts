import { PlayerMetadata, PlayRequest, PlayOptions } from '@/domain/player/Player';

/**
 * MediaMetadataService
 * テキストコンテンツ（ABC記譜法など）からメディアメタデータを抽出するインフラストラクチャサービス。
 */
export class MediaMetadataService {
  /**
   * 指定されたフォーマットのテキストコンテンツを解析し、PlayRequest(の一部)を返します。
   * @param content 解析対象のテキスト
   * @param format フォーマット識別子 ('abc' など)
   */
  public parse(content: string, format: string): Partial<PlayRequest> {
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
  private parseAbc(abcContent: string): Partial<PlayRequest> {
    let src: string | undefined;
    const metadata: PlayerMetadata = {};
    const options: PlayOptions = {};

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
            src = value; // videoId or url
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
          case 'audio_artworkSrc': // 後方互換性のため一旦残すが、将来的には削除
            metadata.thumbnail = value;
            break;
          case 'audio_platform':
            // 簡易バリデーション: 現在は 'youtube' と 'default' のみサポート
            if (value === 'youtube' || value === 'default') {
              metadata.platform = value;
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
            if (!isNaN(start)) options.startSeconds = start;
            break;
          case 'audio_endTime':
          case 'audio_endSeconds':
            const end = parseFloat(value);
            if (!isNaN(end)) options.endSeconds = end;
            break;
        }
      }
    });

    // 意味のあるデータが含まれる場合のみ返す
    return {
      src,
      metadata,
      options,
    };
  }
}
