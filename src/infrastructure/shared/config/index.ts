import { env } from '@/lib/env';
import { InfrastructureConfig, MetadataProviderType, PayloadProviderType } from './types';

/**
 * 環境変数およびデフォルト値に基づいてインフラストラクチャ構成を解決します。
 *
 * 優先順位:
 * 1. 個別の環境変数指定 (INFRA_METADATA_SOURCE, INFRA_PAYLOAD_SOURCE)
 * 2. デフォルト値 (Metadata: turso, Payload: r2)
 */
const resolveConfig = (): InfrastructureConfig => {
  return {
    metadata: (env.INFRA_METADATA_SOURCE as MetadataProviderType) || 'turso',
    payload: (env.INFRA_PAYLOAD_SOURCE as PayloadProviderType) || 'r2',
  };
};

/**
 * インフラストラクチャの共有構成オブジェクト
 */
export const infraConfig = resolveConfig();

export * from './types';
