import { z } from 'zod';

/**
 * サポートされているオーディオプレイヤーの技術プラットフォーム
 */
export const PlayerPlatform = {
  /** YouTube動画 */
  YOUTUBE: 'youtube',
  /** Spotify */
  SPOTIFY: 'spotify',
  /** SoundCloud */
  SOUNDCLOUD: 'soundcloud',
  /** Apple Music */
  APPLE_MUSIC: 'apple-music',
  /** HTML5 Audio (mp3, wav, etc.) */
  HTML5_AUDIO: 'audio-file',
  /** デフォルト / その他 */
  DEFAULT: 'default',
} as const;

export type PlayerPlatformType = (typeof PlayerPlatform)[keyof typeof PlayerPlatform];

/** 基本的な時間（秒）のバリデーション */
const SecondsSchema = z.number().min(0).finite();

/**
 * PlayerSource
 * プレイヤーが再生を行うための技術的なソース情報。
 */
export const PlayerSourceSchema = z
  .object({
    /** 録音ソース識別子 (YouTube Video ID, Spotify URI, Audio URL etc) */
    sourceId: z.string().min(1, 'Source ID is required'),
    /** プロバイダ種別 */
    provider: z.nativeEnum(PlayerPlatform).default(PlayerPlatform.YOUTUBE),
    /** 再生開始位置 (秒) */
    startSeconds: SecondsSchema.default(0),
    /** 再生終了位置 (秒) */
    endSeconds: SecondsSchema.default(0),
    /** 表示用タイトル (Optional) - ソース自体が持つタイトル */
    title: z.string().optional(),
    /** 技術用メタデータ (Optional) */
    metadata: z.record(z.string(), z.any()).optional(),
  })
  .refine(
    (data) => {
      if (data.endSeconds > 0) {
        return data.endSeconds > data.startSeconds;
      }
      return true;
    },
    {
      message: 'endSeconds must be greater than startSeconds',
      path: ['endSeconds'],
    },
  );

export type PlayerSource = z.infer<typeof PlayerSourceSchema>;
