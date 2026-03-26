import { WorkDetailDto } from '../dto/work-detail.dto';

/**
 * Work Detail Query Service (Interface / Port)
 * 作品詳細の読み取り専用ポート。
 * CQRS Read側として、インフラ詳細をアプリケーション層から隠蔽します。
 */
export interface IWorkDetailQueryService {
  /**
   * IDで作品詳細を取得
   * @param workId 作品ID (UUID)
   */
  findById(workId: string): Promise<WorkDetailDto | null>;
}
