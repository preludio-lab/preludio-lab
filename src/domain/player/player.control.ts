import { z } from '@/shared/validation/zod';
import { Id } from '@/shared/id';

/**
 * Player Entity ID
 */
export type PlayerId = Id<'Player'>;

/**
 * PlayerControl
 * プレイヤーの制御情報。
 * IDとライフサイクル情報を管理。
 */
export const PlayerControlSchema = z.object({
  /** プレイヤーセッションのユニークID (UUID) */
  id: z.string().uuid(),
  /** 作成日時 */
  createdAt: z.coerce.date().default(() => new Date()),
  /** 更新日時 */
  updatedAt: z.coerce.date().default(() => new Date()),
});

export type PlayerControl = Omit<z.infer<typeof PlayerControlSchema>, 'id'> & {
  id: PlayerId;
};
