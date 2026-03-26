import { Work } from './work';
import { TransactionContext } from '@/domain/shared/transaction-manager.interface';

/**
 * WorkRepository
 * 作品 (Piece / Composition) リポジトリのインターフェース。
 * 作品全体のマスタメタデータを管理します。
 * 楽章単位の詳細は WorkPartRepository が担います。
 */
export interface WorkRepository {
  /**
   * IDで作品を取得
   * @param id 作品ID
   * @param ctx トランザクションコンテキスト（オプション）
   */
  findById(id: string, ctx?: TransactionContext): Promise<Work | null>;

  /**
   * スラグで作品を取得
   * @param composerId 作曲家ID
   * @param slug 作品スラグ
   * @param ctx トランザクションコンテキスト（オプション）
   */
  findBySlug(composerId: string, slug: string, ctx?: TransactionContext): Promise<Work | null>;

  /**
   * 確定的条件に基づいて作品の一覧（フルエンティティ）を取得
   * @param criteria 抽出条件
   * @param ctx トランザクションコンテキスト（オプション）
   */
  findMany(
    criteria: { composerId?: string; genre?: string; era?: string },
    ctx?: TransactionContext,
  ): Promise<Work[]>;

  /**
   * 作品の保存
   * @param work 作品エンティティ
   * @param ctx トランザクションコンテキスト（オプション）
   */
  save(work: Work, ctx?: TransactionContext): Promise<void>;

  /**
   * 作品の削除
   * @param id 作品ID
   * @param ctx トランザクションコンテキスト（オプション）
   */
  deleteById(id: string, ctx?: TransactionContext): Promise<void>;
}
