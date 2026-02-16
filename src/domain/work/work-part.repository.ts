import { WorkPart } from './work-part';
import { TransactionContext } from '@/domain/shared/transaction-manager.interface';

/**
 * WorkPartRepository
 * 楽章・構成楽曲リポジトリのインターフェース
 */
export interface WorkPartRepository {
  /**
   * IDで楽章を取得
   * @param id 楽章ID
   * @param ctx トランザクションコンテキスト（オプション）
   */
  findById(id: string, ctx?: TransactionContext): Promise<WorkPart | null>;

  /**
   * 作品内の全楽章を取得
   * @param workId 作品ID
   * @param ctx トランザクションコンテキスト（オプション）
   */
  findByWorkId(workId: string, ctx?: TransactionContext): Promise<WorkPart[]>;

  /**
   * 楽章の保存
   * @param part 楽章エンティティ
   * @param ctx トランザクションコンテキスト（オプション）
   */
  save(part: WorkPart, ctx?: TransactionContext): Promise<void>;

  /**
   * 複数の楽章を一括保存
   * @param parts 楽章エンティティのリスト
   * @param ctx トランザクションコンテキスト（オプション）
   */
  saveAll(parts: WorkPart[], ctx?: TransactionContext): Promise<void>;

  /**
   * 楽章の削除
   * @param id 楽章ID
   * @param ctx トランザクションコンテキスト（オプション）
   */
  deleteById(id: string, ctx?: TransactionContext): Promise<void>;

  /**
   * 特定の作品に属する全楽章を削除
   * @param workId 作品ID
   * @param ctx トランザクションコンテキスト（オプション）
   */
  deleteByWorkId(workId: string, ctx?: TransactionContext): Promise<void>;
}
