import { Player } from './player';

/**
 * Player Repository Interface
 * プレイヤーエンティティの永続化・再構築を抽象化します。
 * 現状は永続化要件が明確ではありませんが、アーキテクチャの統一性と
 * 将来的な拡張（LocalStorageへの保存など）のために定義しています。
 */
export interface PlayerRepository {
  /**
   * IDによる取得
   */
  findById(id: string): Promise<Player | null>;

  /**
   * 保存
   */
  save(player: Player): Promise<void>;

  /**
   * 削除
   */
  delete(id: string): Promise<void>;
}
