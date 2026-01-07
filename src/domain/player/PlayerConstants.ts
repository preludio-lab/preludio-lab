/**
 * サポートされているオーディオプレイヤーのプラットフォーム
 */
export const PlayerPlatform = {
  /** YouTube 埋め込みプレイヤー */
  YOUTUBE: 'youtube',
  /** 標準HTML5オーディオ (将来用) */
  DEFAULT: 'default',
} as const;

/** プレイヤーブラットフォームの型定義 */
export type PlayerPlatformType = (typeof PlayerPlatform)[keyof typeof PlayerPlatform];
