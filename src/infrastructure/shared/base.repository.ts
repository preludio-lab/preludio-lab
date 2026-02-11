import { IObjectStorage, ObjectNotFoundError } from '../storage/storage.interface';
import { Logger } from '@/shared/logging/logger';

// -------------------------------------------------------------------------
// BaseMetadataRepository: メタデータ（DB）のみを扱う基底クラス
// -------------------------------------------------------------------------

/**
 * メタデータ（DB等）のみからドメインエンティティを再構成する基底リポジトリクラス。
 * Storage（ペイロード）には依存しません。
 *
 * @template TEntity ドメインエンティティの型
 * @template TMetadata メタデータの型（DataSourceから取得される型）
 * @template TMetadataDataSource メタデータを取得するためのDataSourceの型
 */
export abstract class BaseMetadataRepository<TEntity, TMetadata, TMetadataDataSource> {
  constructor(
    protected readonly metadataDS: TMetadataDataSource,
    protected readonly logger: Logger,
  ) {}

  /**
   * メタデータの取得、そしてドメインエンティティの再構成プロセスを統制します。
   *
   * @param fetcher メタデータを取得するための関数
   * @param contextId ログ出力用のコンテキストID
   */
  protected async findOne(
    fetcher: (ds: TMetadataDataSource) => Promise<TMetadata | null | undefined>,
    contextId: string,
  ): Promise<TEntity | null> {
    const metadata = await fetcher(this.metadataDS);
    // メタデータ（DB等）が見つからない場合は警告をログ出力し、nullを返す
    if (!metadata) {
      this.logger.warn(`Metadata not found for: ${contextId}`, { contextId });
      return null;
    }

    return this.reconstitute(metadata);
  }

  /**
   * メタデータのみからドメインエンティティを再構成します。
   */
  protected abstract reconstitute(metadata: TMetadata): TEntity;
}

// -------------------------------------------------------------------------
// BasePayloadRepository: メタデータ + ペイロードを扱う基底クラス
// -------------------------------------------------------------------------

/**
 * メタデータ（DB等）とペイロード（ストレージ等）を組み合わせてドメインエンティティを再構成する基底リポジトリクラス。
 * BaseMetadataRepository を継承し、Storage機能を追加します。
 */
export abstract class BasePayloadRepository<
  TEntity,
  TMetadata,
  TMetadataDataSource,
> extends BaseMetadataRepository<TEntity, TMetadata, TMetadataDataSource> {
  constructor(
    metadataDS: TMetadataDataSource,
    protected readonly payloadDS: IObjectStorage,
    logger: Logger,
  ) {
    super(metadataDS, logger);
  }

  /**
   * メタデータの取得、ストレージキーの解決、ペイロードの取得、
   * そしてドメインエンティティの再構成プロセスを統制します。
   * 親クラスの findOne をオーバーライドします。
   */
  protected override async findOne(
    fetcher: (ds: TMetadataDataSource) => Promise<TMetadata | null | undefined>,
    contextId: string,
  ): Promise<TEntity | null> {
    const metadata = await fetcher(this.metadataDS);
    // メタデータが見つからない場合は早期リターン
    if (!metadata) {
      this.logger.warn(`Metadata not found for: ${contextId}`, { contextId });
      return null;
    }

    let payload: string | null = null;
    const storageKey = this.resolveStorageKey(metadata);

    // ストレージキーが解決できた場合のみ、外部データソース（ペイロード）から本文等を取得する
    if (storageKey) {
      try {
        payload = await this.payloadDS.get(storageKey);
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

    return this.reconstituteWithPayload(metadata, payload);
  }

  /**
   * メタデータに基づいてペイロードのストレージキー（パス）を解決します。
   */
  protected abstract resolveStorageKey(metadata: TMetadata): string | null;

  /**
   * メタデータとペイロードを組み合わせてドメインエンティティとして再構成します。
   */
  protected abstract reconstituteWithPayload(metadata: TMetadata, payload: string | null): TEntity;

  // 親クラスの抽象メソッド実装（このクラスでは使用されないが実装必須のため）
  // findOne をオーバーライドしているため、通常は呼び出されません。
  protected reconstitute(metadata: TMetadata): TEntity {
    // もし万が一呼び出された場合は、payload=nullとして処理するか、エラーにする方針
    return this.reconstituteWithPayload(metadata, null);
  }
}
