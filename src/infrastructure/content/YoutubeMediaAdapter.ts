/**
 * YouTubeメディアアダプター
 * Infrastructure層の責務として、YouTubeプラットフォーム特有の仕様（サムネイルURL、解像度など）をカプセル化する。
 * UI層が外部プラットフォームの具体的なURL体系に依存することを防ぐ。
 */
export class YoutubeMediaAdapter {
  private static readonly BASE_URL = 'https://img.youtube.com/vi';

  /**
   * YouTube動画IDからサムネイルURLの候補を優先順位順に取得する
   * ブラウザ側でのフォールバック（onErrorイベント等）での使用を想定。
   *
   * 解像度優先順位:
   * 1. maxresdefault (最高画質: 1280x720)
   * 2. sddefault (標準画質: 640x480)
   * 3. hqdefault (高画質: 480x360) - ほとんどの動画で存在
   * 4. mqdefault (中画質: 320x180)
   * 5. default (低画質: 120x90)
   *
   * @param videoId YouTube動画ID (例: dQw4w9WgXcQ)
   */
  static getThumbnailUrlCandidates(videoId: string): string[] {
    if (!videoId) return [];

    return [
      `${this.BASE_URL}/${videoId}/maxresdefault.jpg`,
      `${this.BASE_URL}/${videoId}/sddefault.jpg`,
      `${this.BASE_URL}/${videoId}/hqdefault.jpg`,
      `${this.BASE_URL}/${videoId}/mqdefault.jpg`,
      `${this.BASE_URL}/${videoId}/default.jpg`,
    ];
  }

  /**
   * 最高画質のサムネイル（maxresdefault）のURLを取得する。
   * 存在しない場合は、ContentCard 側でフォールバック処理を行うことを想定。
   * @param videoId YouTube動画ID
   */
  static getStandardThumbnailUrl(videoId: string): string {
    if (!videoId) return '';
    return `${this.BASE_URL}/${videoId}/maxresdefault.jpg`;
  }
}
