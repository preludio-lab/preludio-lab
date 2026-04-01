import { ScoreSource } from './score-source';

/**
 * 楽譜ソースリポジトリ インターフェース
 * 決定論的なソース情報に基づき、楽譜の原本（RAWデータ）を取得する責務を持つ。
 */
export interface ScoreSourceRepository {
  /**
   * 単一のソースに基づき、原本コンテンツ（テキスト）を取得する
   * @param source 楽譜ソースエンティティ
   * @returns 原本コンテンツ（文字列）
   * @throws {InfrastructureError} ネットワークエラー、タイムアウト、404 等
   */
  fetchRawScore(source: ScoreSource): Promise<string>;

  /**
   * 楽曲に関連するすべてのソースを取得する（DB層）
   * @param workId 楽曲ID
   */
  findByWorkId(workId: string): Promise<ScoreSource[]>;

  /**
   * 特定の楽章のソースを取得する（DB層）
   * @param workId 楽曲ID
   * @param partSlug 楽章スラッグ
   */
  findByPartSlug(workId: string, partSlug: string): Promise<ScoreSource | null>;
}
