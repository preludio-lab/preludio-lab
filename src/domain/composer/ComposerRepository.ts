import { Composer } from './Composer';

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
     */
    findById(id: string): Promise<Composer | null>;

    /**
     * Slugによる取得
     */
    findBySlug(slug: string): Promise<Composer | null>;

    /**
     * 複数のIDによる取得
     */
    findByIds(ids: string[]): Promise<Composer[]>;

    /**
     * 条件検索
     */
    findMany(criteria?: ComposerSearchCriteria): Promise<Composer[]>;

    /**
     * 保存
     */
    save(composer: Composer): Promise<void>;

    /**
     * 削除
     */
    delete(id: string): Promise<void>;
}
