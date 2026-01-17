import { z, zInt } from '@/shared/validation/zod';
import { SecondsSchema } from './player-shared';

/**
 * プレイヤーの表示モード
 */
export const PlayerMode = {
  HIDDEN: 'hidden',
  MINI: 'mini',
  INLINE: 'inline',
  IMMERSIVE: 'immersive',
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
  currentTime: SecondsSchema.default(0),
  /** 総再生時間 (秒) */
  duration: SecondsSchema.default(0),
  /** 音量 (0-100) */
  volume: zInt().min(0).max(100).default(50),
  /** プレイヤーの表示モード */
  mode: z.nativeEnum(PlayerMode).default(PlayerMode.HIDDEN),
});

export type PlayerStatus = z.infer<typeof PlayerStatusSchema>;
