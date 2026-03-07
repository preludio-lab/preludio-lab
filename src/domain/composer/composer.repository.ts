import { Composer } from './composer';
import { TransactionContext } from '@/domain/shared/transaction-manager.interface';

/**
 * Composer Search Criteria
 */
export interface ComposerSearchCriteria {
  limit?: number;
  offset?: number;
  // 将来的に時代や国籍フィルターを追加
}

/**
 * Composer Repository Interface
 * 作曲家エンティティの永続化・再構築を抽象化します。
 */
export interface ComposerRepository {
  /**
   * IDによる取得
   * @param id 作曲家ID
   * @param ctx トランザクションコンテキスト（オプション）
   */
  findById(id: string, ctx?: TransactionContext): Promise<Composer | null>;

  /**
   * Slugによる取得
   * @param slug URL用スラグ
   * @param ctx トランザクションコンテキスト（オプション）
   */
  findBySlug(slug: string, ctx?: TransactionContext): Promise<Composer | null>;

  /**
   * 複数のSlugによる取得
   * @param slugs スラグリスト
   * @param ctx トランザクションコンテキスト（オプション）
   */
  findBySlugs(slugs: string[], ctx?: TransactionContext): Promise<Composer[]>;

  /**
   * 複数のIDによる取得
   * @param ids 作曲家IDリスト
   * @param ctx トランザクションコンテキスト（オプション）
   */
  findByIds(ids: string[], ctx?: TransactionContext): Promise<Composer[]>;

  /**
   * 条件検索
   * @param criteria 検索条件
   * @param ctx トランザクションコンテキスト（オプション）
   */
  findMany(criteria?: ComposerSearchCriteria, ctx?: TransactionContext): Promise<Composer[]>;

  /**
   * 保存
   * @param composer 作曲家エンティティ
   * @param ctx トランザクションコンテキスト（オプション）
   */
  save(composer: Composer, ctx?: TransactionContext): Promise<void>;

  /**
   * 複数保存
   * @param composers 作曲家エンティティリスト
   * @param ctx トランザクションコンテキスト（オプション）
   */
  saveMany(composers: Composer[], ctx?: TransactionContext): Promise<void>;

  /**
   * IDによる削除
   * @param id 作曲家ID
   * @param ctx トランザクションコンテキスト（オプション）
   */
  deleteById(id: string, ctx?: TransactionContext): Promise<void>;

  /**
   * Slugによる一括削除
   * @param slugs 作曲家スラグリスト
   * @param ctx トランザクションコンテキスト（オプション）
   */
  deleteBySlugs(slugs: string[], ctx?: TransactionContext): Promise<void>;
}
