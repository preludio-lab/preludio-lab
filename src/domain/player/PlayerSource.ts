import { z, zInt } from '@/shared/validation/zod';
import { PlayerProviderSchema } from './PlayerProvider';
import { MAX_URL_LENGTH } from '@/domain/shared/CommonMetadata';

/** 基本的な時間（秒）のバリデーション (最大24時間 = 86400秒) */
const SecondsSchema = zInt().min(0).max(86400);

/**
 * PlayerSource
 * プレイヤーが再生を行うための技術的なソース情報。
 */
export const PlayerSourceSchema = z
  .object({
    /** 録音ソース識別子 (YouTube Video ID, Spotify URI, Audio URL etc) */
    sourceId: z.string().min(1, 'Source ID is required').max(MAX_URL_LENGTH),
    /** プロバイダ種別 (PlayerProvider 準拠) */
    provider: PlayerProviderSchema.default('generic'),
    /** 再生開始位置 (秒) - 未指定の場合は 0 (最初) から再生 */
    startSeconds: SecondsSchema.optional(),
    /** 再生終了位置 (秒) - 未指定の場合は最後まで再生 */
    endSeconds: SecondsSchema.optional(),
    /** 表示用タイトル (Optional) - ソース自体が持つタイトル */
    title: z.string().optional(),
    /** 技術用メタデータ (Optional) */
    metadata: z.record(z.string(), z.any()).optional(),
  })
  .refine(
    (data) => {
      // endSeconds が指定されている場合のみ、startSeconds との整合性をチェック
      if (data.endSeconds !== undefined) {
        return data.endSeconds > (data.startSeconds ?? 0);
      }
      return true;
    },
    {
      message: 'endSeconds must be greater than startSeconds',
      path: ['endSeconds'],
    },
  );

export type PlayerSource = z.infer<typeof PlayerSourceSchema>;
