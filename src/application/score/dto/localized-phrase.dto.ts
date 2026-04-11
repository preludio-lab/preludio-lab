import { NotationFormat } from '@/domain/score/phrase.metadata';

/**
 * 特定の言語でローカライズされたフレーズ DTO
 */
export interface LocalizedPhraseDto {
  id: string;
  slug: string;
  /** コンテンツ言語でのキャプション */
  caption: string;
  /** 関連エンティティのスラグ (表示用) */
  workSlug?: string;
  composerSlug?: string;
  /** 譜面データ形式 (ABC/MusicXML) */
  format: NotationFormat;
  updatedAt: string;
}
