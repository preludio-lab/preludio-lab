import { IObjectStorage, ObjectNotFoundError } from '../storage/storage.interface';
import { Logger } from '@/shared/logging/logger';

/**
 * メタデータ（DB等）とペイロード（ストレージ等）を組み合わせてドメインエンティティを再構成する基底リポジトリクラス。
 *
 * @template TEntity ドメインエンティティの型
 * @template TMetadata メタデータの型（DataSourceから取得される型）
 * @template TDataSource メタデータを取得するためのDataSourceの型
 */
export abstract class BaseRepository<TEntity, TMetadata, TDataSource> {
  constructor(
    protected readonly dataSource: TDataSource,
    protected readonly storage: IObjectStorage,
    protected readonly logger: Logger,
  ) {}

  /**
   * メタデータの取得、ストレージキーの解決、ペイロードの取得、
   * そしてドメインエンティティの再構成プロセスを統制します。
   *
   * @param fetcher メタデータを取得するための関数
   * @param contextId ログ出力用のコンテキストID
   */
  protected async findOne(
    fetcher: (ds: TDataSource) => Promise<TMetadata | null | undefined>,
    contextId: string,
  ): Promise<TEntity | null> {
    const metadata = await fetcher(this.dataSource);
    if (!metadata) {
      this.logger.warn(`Metadata not found for: ${contextId}`, { contextId });
      return null;
    }

    let payload: string | null = null;
    const storageKey = this.resolveStorageKey(metadata);

    if (storageKey) {
      try {
        payload = await this.storage.get(storageKey);
      } catch (err) {
        if (err instanceof ObjectNotFoundError) {
          this.logger.warn(`Payload not found for key: ${storageKey}`, { contextId });
        } else {
          this.logger.error(`Failed to fetch payload for key: ${storageKey}`, err as Error, {
            contextId,
          });
          throw err;
        }
      }
    }

    return this.reconstitute(metadata, payload);
  }

  /**
   * メタデータに基づいてペイロードのストレージキー（パス）を解決します。
   */
  protected abstract resolveStorageKey(metadata: TMetadata): string | null;

  /**
   * メタデータとペイロードを組み合わせてドメインエンティティとして再構成します。
   */
  protected abstract reconstitute(metadata: TMetadata, payload: string | null): TEntity;
}
