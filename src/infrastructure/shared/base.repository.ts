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
   * 提供されたフェッチャーを用いて DataSource からメタデータを取得し、ドメインエンティティとして再構成します。
   *
   * 【処理フロー】
   * 1. 取得: DataSource から生のデータ（TMetadata）を取得
   * 2. 検証: データ不在時は警告ログを記録し null を返却
   * 3. 変換: 取得したデータを reconstitute によりドメインエンティティへ変換（再構成）して返却
   * @param identity 探索対象を特定するための識別子（IDやスラグなど、主にログ出力に使用）
   * @param fetcher DataSource を用いた具体的な探索ロジック
   * @returns 再構成されたドメインエンティティ。見つからない場合は null を返却します。
   */
  protected async _findOne(
    identity: string,
    fetcher: (ds: TMetadataDataSource) => Promise<TMetadata | undefined>,
  ): Promise<TEntity | null> {
    const metadata = await fetcher(this.metadataDS);
    // メタデータが見つからない場合は警告をログ出力して null を返します
    if (!metadata) {
      this.logger.warn(`Metadata not found for identity: ${identity}`, { identity });
      return null;
    }

    this.logger.debug(`Metadata found for identity: ${identity}`, { identity });

    return this.reconstitute(metadata);
  }

  /**
   * 検索条件に基づき、DataSource から複数件のメタデータを取得し、ドメインエンティティの一覧として返却します。
   *
   * 【処理フロー】
   * 1. DataSource から条件に合致するメタデータ行（rows）と総件数（totalCount）を取得
   * 2. 各行をドメインエンティティへ変換（変換失敗時は該当行をログ出力して除外）
   * 3. ページネーション情報を付与した PagedResponse 形式でパッキングして返却
   *
   * @param criteria 検索条件およびページネーション情報
   * @param fetcher DataSource を用いた具体的な一覧取得ロジック
   * @returns 変換済みのエンティティ一覧とページネーション情報を含むレスポンス
   */
  protected async _findMany(
    criteria: TCriteria,
    fetcher: (ds: TMetadataDataSource) => Promise<{ rows: TMetadata[]; totalCount: number }>,
  ): Promise<PagedResponse<TEntity>> {
    // データソースから検索条件に合致するメタデータと総件数を取得します
    const { rows, totalCount } = await fetcher(this.metadataDS);

    this.logger.debug(`Found ${rows.length} metadata rows (Total: ${totalCount})`, {
      criteria,
    });

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
   *
   * @param entity 保存対象のドメインエンティティ
   */
  public async save(entity: TEntity): Promise<void> {
    const row = this.mapToPersistence(entity);
    await this.persistMetadata(row);
    this.logger.info(`Metadata saved successfully`, { entity: String(entity) });
  }

  /**
   * エンティティを削除します。
   *
   * @param id 削除対象の外部一意識別子（ID）
   */
  public async delete(id: string): Promise<void> {
    await this.deleteMetadata(id);
    this.logger.info(`Metadata deleted successfully`, { id });
  }

  /**
   * メタデータのみからドメインエンティティを再構成します。
   *
   * @param metadata DataSource から取得された生のメタデータ
   * @returns 再構成されたドメインエンティティ
   */
  protected abstract reconstitute(metadata: TMetadata): TEntity;

  /**
   * ドメインエンティティから永続化用のメタデータに変換します。
   *
   * @param entity ドメインエンティティ
   * @returns 永続化層のデータ構造（メタデータ行）
   */
  protected abstract mapToPersistence(entity: TEntity): TMetadata;

  /**
   * メタデータをデータソースに永続化します。
   *
   * @param row 永続化対象のメタデータ行
   */
  protected abstract persistMetadata(row: TMetadata): Promise<void>;

  /**
   * メタデータをデータソースから削除します。
   *
   * @param id 削除対象の識別子
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
   * メタデータとペイロード（本文等）の両方を個別のデータソースから取得・統合し、
   * 一つの完全なドメインエンティティとして再構成します。
   *
   * 【処理フロー】
   * 1. メタデータ取得: 基底クラスの仕組みを用いてメタデータを取得（不在時は早期リターン）
   * 2. ペイロード取得: メタデータから特定したパスを用いてストレージから実体データを取得
   * 3. 統合再構成: 両者を組み合わせ、完全な状態のドメインエンティティを生成して返却
   *
   * @param identity 探索対象を特定するための識別子（IDやスラグなど、主にログ出力に使用）
   * @param fetcher DataSource を用いた具体的な探索ロジック
   * @returns ペイロードと統合された完全なドメインエンティティ。見つからない場合は null を返却します。
   */
  protected override async _findOne(
    identity: string,
    fetcher: (ds: TMetadataDataSource) => Promise<TMetadata | undefined>,
  ): Promise<TEntity | null> {
    const metadata = await fetcher(this.metadataDS);
    // メタデータが見つからない場合は警告をログ出力して null を返します
    if (!metadata) {
      this.logger.warn(`Metadata not found for identity: ${identity}`, { identity });
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
          this.logger.warn(`Payload not found for key: ${storageKey}`, { identity });
        } else {
          this.logger.error(`Failed to fetch payload for key: ${storageKey}`, err as Error, {
            identity,
          });
          throw err;
        }
      }
    }

    this.logger.debug(`Metadata and payload found for identity: ${identity}`, { identity });

    return this.reconstituteWithPayload(metadata, payload);
  }

  /**
   * メタデータとペイロードの両方を保存します。
   *
   * @param entity 保存対象のドメインエンティティ
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
      this.logger.info(`Payload saved successfully: ${storageKey}`, { storageKey });
    }
  }

  /**
   * メタデータとペイロードの両方を削除します。
   *
   * @param id 削除対象の識別子（ID）
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
        this.logger.info(`Payload deleted successfully: ${storageKey}`, { storageKey });
      }
    }

    // メタデータの削除
    await super.delete(id);
  }

  /**
   * メタデータに基づいてペイロードのストレージキー（パス）を解決します。
   *
   * @param metadata DataSource から取得されたメタデータ
   * @returns ストレージキー（パス）。ペイロードが存在しない場合は null。
   */
  protected abstract resolveStorageKey(metadata: TMetadata): string | null;

  /**
   * メタデータとペイロードを組み合わせてドメインエンティティとして再構成します。
   *
   * @param metadata メタデータ
   * @param payload ストレージから取得されたペイロードのコンテンツ（存在しない場合はnull）
   * @returns 統合・再構成されたドメインエンティティ
   */
  protected abstract reconstituteWithPayload(metadata: TMetadata, payload: string | null): TEntity;

  /**
   * エンティティからペイロード（本文等）を抽出します。
   *
   * @param entity ドメインエンティティ
   * @returns 抽出されたペイロードの文字列。存在しない場合は null。
   */
  protected abstract extractPayload(entity: TEntity): string | null;

  /**
   * ペイロードをストレージに永続化します。
   *
   * @param key ストレージキー
   * @param content 保存するコンテンツ
   */
  protected abstract persistPayload(key: string, content: string): Promise<void>;

  /**
   * ペイロードをストレージから削除します。
   *
   * @param key ストレージキー
   */
  protected abstract deletePayload(key: string): Promise<void>;

  /**
   * 削除前にメタデータを取得するためのメソッド。
   *
   * @param id 取得対象の識別子
   * @returns 取得されたメタデータ。見つからない場合は null。
   */
  protected abstract getMetadataById(id: string): Promise<TMetadata | null>;

  protected reconstitute(metadata: TMetadata): TEntity {
    return this.reconstituteWithPayload(metadata, null);
  }
}
