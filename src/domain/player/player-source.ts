import { z } from '@/shared/validation/zod';
import { PlayerProviderSchema } from './player-shared';
import { MAX_URL_LENGTH } from '@/domain/shared/common-metadata';
import { SecondsSchema } from './player-shared';
/**
 * SecondsSchema 用の時間範囲バリデーションロジック
 * endSeconds が指定されている場合、startSeconds より大きいことを確認する
 */
const playerTimeRangeValidation = (data: { startSeconds?: number; endSeconds?: number }) => {
  if (data.endSeconds !== undefined) {
    return data.endSeconds > (data.startSeconds ?? 0);
  }
  return true;
};

const playerTimeRangeError = {
  message: 'endSeconds must be greater than startSeconds',
  path: ['endSeconds'],
};

/**
 * PlayerSource
 * プレイヤーが再生を行うための技術的なソース情報。
 */
/**
 * PlayerSourceBaseSchema
 * プレイヤーソースの基本データ構造。
 * 継承やマージでの利用を想定しています。
 */
export const PlayerSourceBaseSchema = z.object({
  /** 録音ソース識別子 (YouTube Video ID, Spotify URI, Audio URL etc) */
  sourceId: z.string().min(1, 'Source ID is required').max(MAX_URL_LENGTH),
  /** プロバイダ種別 (PlayerProvider 準拠) */
  provider: PlayerProviderSchema.default('generic'),
  /** 再生開始位置 (秒) - 未指定の場合は 0 (最初) から再生 */
  startSeconds: SecondsSchema.optional(),
  /** 再生終了位置 (秒) - 未指定の場合は最後まで再生 */
  endSeconds: SecondsSchema.optional(),
});

/**
 * PlayerSourceSchema
 * 再生終了位置が開始位置より後であることを保証するバリデーション済みのスキーマ。
 */
export const PlayerSourceSchema = PlayerSourceBaseSchema.refine(
  playerTimeRangeValidation,
  playerTimeRangeError,
);

export type PlayerSource = z.infer<typeof PlayerSourceSchema>;
