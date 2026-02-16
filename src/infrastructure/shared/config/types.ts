/**
 * メタデータ（DB）プロバイダーの型定義
 */
export type MetadataProviderType = 'turso' | 'fs' | 'mock';

/**
 * ペイロード（ストレージ）プロバイダーの型定義
 */
export type PayloadProviderType = 'r2' | 'fs' | 'mock';

/**
 * インフラストラクチャ全体の構成インターフェース
 */
export interface InfrastructureConfig {
  metadata: MetadataProviderType;
  payload: PayloadProviderType;
}
