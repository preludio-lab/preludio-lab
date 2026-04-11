import { TransactionContext } from '@/domain/shared/transaction-manager.interface';
import * as schema from '@/infrastructure/database/schema';

/**
 * phrases テーブルの単一行モデル
 */
export type PhraseRow = typeof schema.phrases.$inferSelect;

/**
 * phrase_translations テーブルの単一行モデル
 */
export type PhraseTranslationRow = typeof schema.phraseTranslations.$inferSelect;

/**
 * JOIN済みデータの型定義 (スラグ解決用)
 */
export type PhraseRows = {
  phrase: PhraseRow;
  translations: PhraseTranslationRow[];
  /** 関連エンティティのスラグ解決用データ (Optional JOIN) */
  composer?: { slug: string };
  work?: { slug: string };
  workPart?: { slug: string };
  score?: { slug: string };
};

/**
 * フレーズ データソース インターフェース
 */
export interface IPhraseDataSource {
  findById(id: string, ctx?: TransactionContext): Promise<PhraseRows | null>;
  findByWorkSlug(workSlug: string, ctx?: TransactionContext): Promise<PhraseRows[]>;
  findMany(limit?: number, offset?: number, ctx?: TransactionContext): Promise<PhraseRows[]>;
  /**
   * アトミックな保存 (Upsert)
   * 内部で phrases の更新と translations の Refresh (Delete & Insert) を実施
   */
  upsert(rows: PhraseRows, ctx?: TransactionContext): Promise<void>;
  deleteById(id: string, ctx?: TransactionContext): Promise<void>;
}
