import { Phrase, PhraseId } from './phrase';

/**
 * フレーズリポジトリ インターフェース
 */
export interface PhraseRepository {
  findById(id: PhraseId): Promise<Phrase | null>;
  /** 楽曲スラグに基づくフレーズ一覧の取得 */
  findByWorkSlug(workSlug: string): Promise<Phrase[]>;
  /** フレーズの新規登録または更新（アトミックな保存） */
  upsert(phrase: Phrase): Promise<void>;
  /** IDによるフレーズの物理削除 */
  deleteById(id: PhraseId): Promise<void>;
  /** 全フレーズの取得（ページネーション可能） */
  findMany(limit?: number, offset?: number): Promise<Phrase[]>;
}
