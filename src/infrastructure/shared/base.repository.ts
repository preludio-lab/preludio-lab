import { IObjectStorage, ObjectNotFoundError } from '../storage/storage.interface';
import { Logger } from '@/shared/logging/logger';
import { PagedResponse } from '@/domain/shared/pagination';

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
 * @template TCriteria 検索条件の型
 */
export abstract class BaseMetadataRepository<
  TEntity,
  TMetadata,
  TMetadataDataSource,
  TCriteria extends { pagination: { limit: number; offset: number } },
> {
  constructor(
    protected readonly metadataDS: TMetadataDataSource,
    protected readonly logger: Logger,
  ) {}

  /**
   * メタデータの取得、そしてドメインエンティティの再構成プロセスを統制します。
   */
  protected async findOne(
    fetcher: (ds: TMetadataDataSource) => Promise<TMetadata | null | undefined>,
    contextId: string,
  ): Promise<TEntity | null> {
    const metadata = await fetcher(this.metadataDS);
    // メタデータが見つからない場合は警告をログ出力して null を返します
    if (!metadata) {
      this.logger.warn(`Metadata not found for: ${contextId}`, { contextId });
      return null;
    }

    return this.reconstitute(metadata);
  }

  /**
   * 検索条件に基づいて複数件取得し、ページネーション対応レスポンスを返します。
   */
  protected async performFindMany(
    fetcher: (
      ds: TMetadataDataSource,
      criteria: TCriteria,
    ) => Promise<{ rows: TMetadata[]; totalCount: number }>,
    criteria: TCriteria,
  ): Promise<PagedResponse<TEntity>> {
    // データソースから検索条件に合致するメタデータと総件数を取得します
    const { rows, totalCount } = await fetcher(this.metadataDS, criteria);

    // 取得した各全メタデータ（行）をドメインエンティティに変換（再構成）します
    const items = rows
      .map((row) => {
        try {
          return this.reconstitute(row);
        } catch (e) {
          this.logger.error('Reconstitution failed in findMany', e as Error);
          return null;
        }
      })
      .filter((item): item is TEntity => item !== null);

    // ページネーション情報を付与してレスポンスを返します
    const { limit, offset } = criteria.pagination;

    return {
      items,
      totalCount,
      hasNextPage: offset + limit < totalCount,
    };
  }

  /**
   * エンティティを保存（永続化）します。
   */
  public async save(entity: TEntity): Promise<void> {
    const row = this.mapToPersistence(entity);
    await this.persistMetadata(row);
  }

  /**
   * エンティティを削除します。
   */
  public async delete(id: string): Promise<void> {
    await this.deleteMetadata(id);
  }

  /**
   * メタデータのみからドメインエンティティを再構成します。
   */
  protected abstract reconstitute(metadata: TMetadata): TEntity;

  /**
   * ドメインエンティティから永続化用のメタデータに変換します。
   */
  protected abstract mapToPersistence(entity: TEntity): TMetadata;

  /**
   * メタデータをデータソースに永続化します。
   */
  protected abstract persistMetadata(row: TMetadata): Promise<void>;

  /**
   * メタデータをデータソースから削除します。
   */
  protected abstract deleteMetadata(id: string): Promise<void>;
}

// -------------------------------------------------------------------------
// BasePayloadRepository: メタデータ + ペイロードを扱う基底クラス
// -------------------------------------------------------------------------

/**
 * メタデータ（DB等）とペイロード（ストレージ等）を組み合わせてドメインエンティティを再構成する基底リポジトリクラス。
 */
export abstract class BasePayloadRepository<
  TEntity,
  TMetadata,
  TMetadataDataSource,
  TCriteria extends { pagination: { limit: number; offset: number } },
> extends BaseMetadataRepository<TEntity, TMetadata, TMetadataDataSource, TCriteria> {
  constructor(
    metadataDS: TMetadataDataSource,
    protected readonly payloadDS: IObjectStorage,
    logger: Logger,
  ) {
    super(metadataDS, logger);
  }

  /**
   * メタデータとペイロードの両方を取得して再構成します。
   */
  protected override async findOne(
    fetcher: (ds: TMetadataDataSource) => Promise<TMetadata | null | undefined>,
    contextId: string,
  ): Promise<TEntity | null> {
    const metadata = await fetcher(this.metadataDS);
    // メタデータが見つからない場合は警告をログ出力して null を返します
    if (!metadata) {
      this.logger.warn(`Metadata not found for: ${contextId}`, { contextId });
      return null;
    }

    let payload: string | null = null;
    const storageKey = this.resolveStorageKey(metadata);

    // ストレージキーが解決できた場合のみ、ペイロード（本文等）を取得します
    if (storageKey) {
      try {
        payload = await this.payloadDS.get(storageKey);
      } catch (err) {
        // ペイロードが見つからない（404）場合は警告ログに留め、処理は継続します
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
   * メタデータとペイロードの両方を保存します。
   */
  public override async save(entity: TEntity): Promise<void> {
    // 1. メタデータの保存 (BaseMetadataRepository.save を利用)
    await super.save(entity);

    // 2. ペイロードの保存
    const metadata = this.mapToPersistence(entity);
    const storageKey = this.resolveStorageKey(metadata);
    const payload = this.extractPayload(entity);

    // ストレージ上の保存先キーとペイロードの中身の両方が存在する場合にのみ、パブリッシュ（保存）を実行します
    if (storageKey && payload !== null) {
      await this.persistPayload(storageKey, payload);
    }
  }

  /**
   * メタデータとペイロードの両方を削除します。
   */
  public override async delete(id: string): Promise<void> {
    // 記事IDからメタデータを取得してストレージキーを特定する必要がある場合がある
    // ここでは簡易的に ID からキーが導出できるか、または削除対象の特定を子クラスに任せる
    // 削除対象のメタデータを特定し、それに関連付けられたペイロードも削除します
    const metadata = await this.getMetadataById(id);
    if (metadata) {
      const storageKey = this.resolveStorageKey(metadata);
      // ストレージキーが特定できた場合のみペイロードの削除を試みます
      if (storageKey) {
        await this.deletePayload(storageKey);
      }
    }

    // メタデータの削除
    await super.delete(id);
  }

  /**
   * メタデータに基づいてペイロードのストレージキー（パス）を解決します。
   */
  protected abstract resolveStorageKey(metadata: TMetadata): string | null;

  /**
   * メタデータとペイロードを組み合わせてドメインエンティティとして再構成します。
   */
  protected abstract reconstituteWithPayload(metadata: TMetadata, payload: string | null): TEntity;

  /**
   * エンティティからペイロード（本文等）を抽出します。
   */
  protected abstract extractPayload(entity: TEntity): string | null;

  /**
   * ペイロードをストレージに永続化します。
   */
  protected abstract persistPayload(key: string, content: string): Promise<void>;

  /**
   * ペイロードをストレージから削除します。
   */
  protected abstract deletePayload(key: string): Promise<void>;

  /**
   * 削除前にメタデータを取得するためのメソッド。
   */
  protected abstract getMetadataById(id: string): Promise<TMetadata | null>;

  protected reconstitute(metadata: TMetadata): TEntity {
    return this.reconstituteWithPayload(metadata, null);
  }
}
