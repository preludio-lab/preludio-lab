import { Work } from './Work';

/**
 * Work Search Criteria
 * 作品の検索条件 (将来的に公開範囲やカテゴリ等が増えることを想定)
 */
export interface WorkSearchCriteria {
  composerId?: string;
  genre?: string;
  era?: string;
  limit?: number;
  offset?: number;
}

/**
 * WorkRepository
 * 作品リポジトリのインターフェース
 */
export interface WorkRepository {
  /**
   * IDで作品を取得
   */
  findById(id: string): Promise<Work | null>;

  /**
   * スラグで作品を取得
   */
  findBySlug(composerId: string, slug: string): Promise<Work | null>;

  /**
   * 条件に一致する作品を取得
   */
  findMany(criteria: WorkSearchCriteria): Promise<Work[]>;

  /**
   * 作品の保存
   */
  save(work: Work): Promise<void>;

  /**
   * 作品の削除
   */
  delete(id: string): Promise<void>;
}
