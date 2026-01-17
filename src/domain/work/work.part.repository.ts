import { WorkPart } from './work.part';

/**
 * WorkPartRepository
 * 楽章・構成楽曲リポジトリのインターフェース
 */
export interface WorkPartRepository {
  /**
   * IDで楽章を取得
   */
  findById(id: string): Promise<WorkPart | null>;

  /**
   * 作品内の全楽章を取得
   */
  findByWorkId(workId: string): Promise<WorkPart[]>;

  /**
   * 楽章の保存
   */
  save(part: WorkPart): Promise<void>;

  /**
   * 楽章の削除
   */
  delete(id: string): Promise<void>;

  /**
   * 特定の作品に属する全楽章を削除
   */
  deleteByWorkId(workId: string): Promise<void>;
}
