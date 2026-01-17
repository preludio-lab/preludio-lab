import { z } from 'zod';
import { PlayerControlSchema, PlayerControl } from './player.control';
import {
  PlayerDisplaySchema,
  PlayerDisplay,
  DisplayTypeSchema,
  DisplayType,
} from './player.display';
import { PlayerSourceSchema, PlayerSource } from './player-source';
import { PlayerStatusSchema, PlayerStatus, PlayerMode } from './player-status';
import { PlayerProviderSchema, PlayerProvider } from './player-shared';

/**
 * Player Entity
 * プレイヤーのドメインエンティティ (Aggregate Root / Coordinator)
 * 制御(Control)、表示(Display)、ソース(Source)、状態(Status)を束ねる。
 */
export const PlayerSchema = z.object({
  control: PlayerControlSchema,
  display: PlayerDisplaySchema,
  source: PlayerSourceSchema,
  status: PlayerStatusSchema,
});

/** プレイヤーのプロパティ定義 */
export type PlayerProps = z.infer<typeof PlayerSchema>;

/**
 * Player
 * プレイヤーのドメインエンティティ (Aggregate Root / Coordinator)
 * 制御(Control)、表示(Display)、ソース(Source)、状態(Status)を束ねる。
 */
export class Player implements PlayerProps {
  /** 制御情報: ID、作成・更新日時などのライフサイクル管理 */
  readonly control: PlayerControl;
  /** 表示情報: タイトル、演奏者、画像などのUI投影用データ */
  readonly display: PlayerDisplay;
  /** 技術ソース: 再生の実体データ（YouTube ID、開始/終了秒数等） */
  readonly source: PlayerSource;
  /** 実行状態: 再生中フラグ、現在時間、音量、表示モード等 */
  readonly status: PlayerStatus;

  constructor(props: PlayerProps) {
    this.control = props.control;
    this.display = props.display;
    this.source = props.source;
    this.status = props.status;
  }

  // --- Convenience Getters ---
  get id() {
    return this.control.id;
  }
  get title() {
    return this.display.title;
  }
  get isPlaying() {
    return this.status.isPlaying;
  }
}

// --- Re-exports for convenience ---
export { PlayerControlSchema };
export type { PlayerControl };
export { PlayerDisplaySchema };
export type { PlayerDisplay };
export { PlayerSourceSchema };
export type { PlayerSource };
export { PlayerStatusSchema, PlayerMode };
export type { PlayerStatus };
export { PlayerProviderSchema, PlayerProvider };
export { DisplayTypeSchema, DisplayType };
