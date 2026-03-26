/**
 * Composer Search Result
 * Async Typeahead 用の軽量な作曲家検索結果。
 */
export interface ComposerSearchResult {
  id: string;
  slug: string;
  displayName: string;
}

/**
 * Composer Search Query Service (Interface / Port)
 * 作曲家の名前検索に特化した読み取り専用ポート。
 */
export interface IComposerSearchQueryService {
  /**
   * 名前による作曲家検索
   * @param query 検索クエリ文字列
   * @param lang 検索対象言語
   * @param limit 最大件数 (default: 10)
   */
  searchByName(query: string, lang: string, limit?: number): Promise<ComposerSearchResult[]>;
}
