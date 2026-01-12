import { z } from 'zod';

/**
 * プレイヤーの表示モード
 */
export const PlayerMode = {
  HIDDEN: 'hidden',
  MINI: 'mini',
  FOCUS: 'focus',
} as const;

export type PlayerMode = (typeof PlayerMode)[keyof typeof PlayerMode];

/**
 * PlayerStatus
 * プレイヤーの実行時の状態情報。
 */
export const PlayerStatusSchema = z.object({
  /** 再生中かどうか */
  isPlaying: z.boolean().default(false),
  /** 現在の再生時間 (秒) */
  currentTime: z.number().min(0).default(0),
  /** 総再生時間 (秒) */
  duration: z.number().min(0).default(0),
  /** 音量 (0-100) */
  volume: z.number().min(0).max(100).default(100),
  /** プレイヤーの表示モード */
  mode: z.nativeEnum(PlayerMode).default(PlayerMode.HIDDEN),
});

export type PlayerStatus = z.infer<typeof PlayerStatusSchema>;
