import { WorkSearchRequestParams } from '../dto/search-works.dto';

/**
 * Raw Work Summary
 * インフラ層（DataSource 等）から返却される、ドメインエンティティ化される前の生のデータ構造。
 * 結合等の都合を考慮した、読み取り専用の軽量な型です。
 *
 * アプリケーション層に定義される「ポート（契約）」の一部です。
 */
export interface RawWorkSummary {
  id: string;
  slug: string;
  localizedTitle: string;
  compositionYear: number | null;
  composer: {
    slug: string;
    name: string;
  };
}

/**
 * Raw Paged Response
 * ページネーション情報を含む Raw データのレスポンス形式。
 */
export interface RawPagedResponse<T> {
  items: T[];
  totalCount: number;
  hasNextPage: boolean;
}

/**
 * Work Query Service (Interface / Port)
 * 作品の検索・一覧取得に特化した、読み取り専用のアプリケーションポート。
 * 更新を伴わないため TransactionManager は不要。
 */
export interface WorkQueryService {
  /**
   * 検索条件に合致する作品の軽量データを取得する
   * @param params 検索・ページング条件
   */
  searchWorks(params: WorkSearchRequestParams): Promise<RawPagedResponse<RawWorkSummary>>;
}
