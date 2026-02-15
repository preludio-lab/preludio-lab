import { IObjectStorage, ObjectNotFoundError } from '../storage/storage.interface';
import { Logger } from '@/shared/logging/logger';
import { PagedResponse } from '@/domain/shared/pagination';

// -------------------------------------------------------------------------
// BaseMetadataRepository: メタデータ（DB）のみを扱う基底クラス
// -------------------------------------------------------------------------

/**
 * メタデータ（DBなど）のみを扱うリポジトリの基底クラス。
 *
 * @template TBase メタデータから再構築されるドメインエンティティまたはサマリーの型
 * @template TMetadataRow データソースからの生のメタデータ行の型
 * @template TMetadataDataSource メタデータのデータソース型
 * @template TCriteria 検索条件の型
 */
export abstract class BaseMetadataRepository<
  TBase,
  TMetadataRow,
  TMetadataDataSource,
  TCriteria extends { pagination: { limit: number; offset: number } },
> {
  constructor(
    protected readonly metadataDS: TMetadataDataSource,
    protected readonly logger: Logger,
  ) {}

  /**
   * 提供されたフェッチャーを使用して単一のエンティティを取得し、再構築します。
   *
   * 処理フロー:
   * 1. fetcher を実行して生のメタデータ (TMetadataRow) を取得
   * 2. メタデータが存在しない場合は警告をログ出力し、null を返す
   * 3. 抽象メソッド reconstituteMetadata を呼び出し、メタデータをドメイン型 (TBase) に変換して返す
   *
   * @param identity - エンティティを識別するための識別子（ログ出力用）
   * @param fetcher - データソースからメタデータを取得する関数
   * @returns 再構築されたエンティティ、または存在しない場合は null
   */
  protected async _findOne(
    identity: string,
    fetcher: (ds: TMetadataDataSource) => Promise<TMetadataRow | undefined>,
  ): Promise<TBase | null> {
    const metadata = await fetcher(this.metadataDS);
    if (!metadata) {
      this.logger.warn(`Metadata not found for identity: ${identity}`, { identity });
      return null;
    }

    this.logger.debug(`Metadata found for identity: ${identity}`, { identity });

    return this.reconstituteMetadata(metadata);
  }

  /**
   * 検索条件に基づいて複数のエンティティを取得します。
   *
   * 処理フロー:
   * 1. fetcher を実行してメタデータの配列と総件数を取得
   * 2. 各行に対して reconstituteMetadata を実行し、ドメイン型に変換
   *    - 変換に失敗した行はログ出力してスキップ
   * 3. ページング情報とあわせて PagedResponse 形式で返す
   *
   * @param criteria - 検索条件（ページング情報を含む）
   * @param fetcher - データソースから複数のメタデータを取得する関数
   * @returns ページングされたエンティティのリスト
   */
  protected async _findMany(
    criteria: TCriteria,
    fetcher: (ds: TMetadataDataSource) => Promise<{ rows: TMetadataRow[]; totalCount: number }>,
  ): Promise<PagedResponse<TBase>> {
    const { rows, totalCount } = await fetcher(this.metadataDS);

    this.logger.debug(`Found ${rows.length} metadata rows (Total: ${totalCount})`, {
      criteria,
    });

    const items = rows
      .map((row) => {
        try {
          return this.reconstituteMetadata(row);
        } catch (e) {
          this.logger.error('Reconstitution failed in findMany', e as Error);
          return null;
        }
      })
      .filter((item): item is TBase => item !== null);

    const { limit, offset } = criteria.pagination;

    return {
      items,
      totalCount,
      hasNextPage: offset + limit < totalCount,
    };
  }

  /**
   * エンティティ（メタデータのみ）を保存します。
   *
   * 処理フロー:
   * 1. 抽象メソッド toPersistenceMetadata を呼び出し、エンティティを永続化形式に変換
   * 2. saver コールバックを実行して保存処理を委譲
   * 3. 完了をログ出力
   *
   * @param entity - 保存対象のドメインエンティティ
   * @param saver - メタデータをデータソースに保存する関数
   */
  protected async _save(
    entity: TBase,
    saver: (ds: TMetadataDataSource, row: TMetadataRow) => Promise<void>,
  ): Promise<void> {
    const row = this.toPersistenceMetadata(entity);
    await saver(this.metadataDS, row);
    this.logger.info(`Metadata saved successfully`, { entity: String(entity) });
  }

  /**
   * ID を指定してエンティティを削除します。
   *
   * 処理フロー:
   * 1. deleter コールバックを実行してメタデータの物理・論理削除を委譲
   * 2. 完了をログ出力
   *
   * @param id - 削除対象の ID
   * @param deleter - データソースからメタデータを削除する関数
   */
  protected async _delete(
    id: string,
    deleter: (ds: TMetadataDataSource) => Promise<void>,
  ): Promise<void> {
    await deleter(this.metadataDS);
    this.logger.info(`Metadata deleted successfully`, { id });
  }

  /**
   * 生のメタデータからドメインエンティティ/サマリーを再構築します。
   *
   * @param metadata - データソースから取得した生のメタデータ
   * @returns 再構築されたドメインオブジェクト
   */
  protected abstract reconstituteMetadata(metadata: TMetadataRow): TBase;

  /**
   * ドメインエンティティ/サマリーを永続化形式にマッピングします。
   *
   * @param entity - ドメインオブジェクト
   * @returns 永続化用のデータ形式
   */
  protected abstract toPersistenceMetadata(entity: TBase): TMetadataRow;
}

// -------------------------------------------------------------------------
// BasePayloadRepository: メタデータ + ペイロードを扱う基底クラス
// -------------------------------------------------------------------------

/**
 * メタデータとペイロード（オブジェクトストレージ）の両方を扱うリポジトリの基底クラス。
 *
 * @template TAggregate 完全なドメインエンティティ（アグリゲートルート）
 * @template TBase ドメインの基本/サマリー型（メタデータのみから再構築される型）
 * @template TMetadataRow 生のメタデータ行の型
 * @template TMetadataDataSource メタデータのデータソース型
 * @template TCriteria 検索条件の型
 */
export abstract class BasePayloadRepository<
  TAggregate extends TBase,
  TBase,
  TMetadataRow,
  TMetadataDataSource,
  TCriteria extends { pagination: { limit: number; offset: number } },
> extends BaseMetadataRepository<TBase, TMetadataRow, TMetadataDataSource, TCriteria> {
  constructor(
    metadataDS: TMetadataDataSource,
    protected readonly payloadDS: IObjectStorage,
    logger: Logger,
  ) {
    super(metadataDS, logger);
  }

  /**
   * メタデータとペイロードをマージして単一のアグリゲートを再構築します。
   *
   * 処理フロー:
   * 1. メタデータ (MetadataRow) を取得
   * 2. メタデータから基本サマリー (TBase) を再構築
   * 3. メタデータからストレージキーを解決
   * 4. ストレージキーが存在する場合、オブジェクトストレージからペイロード (MDX 等) を取得
   * 5. サマリーとペイロードを結合して完全なアグリゲート (TAggregate) を構築して返す
   *
   * @param identity - 取得対象の識別子
   * @param fetcher - メタデータを取得する関数
   * @returns 再構築されたアグリゲート、または存在しない場合は null
   */
  protected override async _findOne(
    identity: string,
    fetcher: (ds: TMetadataDataSource) => Promise<TMetadataRow | undefined>,
  ): Promise<TAggregate | null> {
    const metadataRow = await fetcher(this.metadataDS);
    if (!metadataRow) {
      this.logger.warn(`Metadata not found for identity: ${identity}`, { identity });
      return null;
    }

    const base = this.reconstituteMetadata(metadataRow);
    let payload: string | null = null;
    const storageKey = this.resolveStorageKey(base);

    if (storageKey) {
      try {
        payload = await this.payloadDS.get(storageKey);
      } catch (err) {
        if (err instanceof ObjectNotFoundError) {
          this.logger.warn(`Payload not found for key: ${storageKey}`, { identity });
        } else {
          this.logger.error(`Failed to fetch payload for key: ${storageKey}`, err as Error, {
            identity,
          });
          throw err;
        }
      }
    } else {
      this.logger.warn(
        `No storage key resolved for identity: ${identity}. Skipping payload fetch.`,
      );
    }

    this.logger.debug(`Metadata and payload processed for identity: ${identity}`, { identity });

    return this.reconstituteAggregate(base, payload);
  }

  /**
   * メタデータとペイロードの両方を保存します。
   * 通常、フルアグリゲートを保存する際に使用します。
   *
   * 処理フロー:
   * 1. エンティティからメタデータ (row) とペイロードを準備
   * 2. ペイロード保存 (R2) (**DB保存より先に実行**)
   *    - 失敗時は例外をスローし、DB保存を行わない
   * 3. メタデータ保存 (DB)
   *    - 失敗時は R2 からの**削除（ロールバック）**を試みる (Best-Effort)
   *
   * @param entity - 保存対象のアグリゲート
   * @param saver - メタデータを保存する関数
   */
  protected override async _save(
    entity: TAggregate,
    saver: (ds: TMetadataDataSource, row: TMetadataRow) => Promise<void>,
  ): Promise<void> {
    // 1. Prepare Data
    const row = this.toPersistenceMetadata(entity);
    const storageKey = this.resolveStorageKey(entity);
    const payload = this.toPersistencePayload(entity);

    // 2. Save Payload FIRST (Storage First Strategy)
    if (storageKey && payload !== null) {
      // If this fails, we just throw. DB is not touched yet.
      await this.persistPayload(storageKey, payload);
      this.logger.info(`Payload saved successfully: ${storageKey}`, { storageKey });
    } else if (payload !== null) {
      this.logger.warn(
        `Payload exists but storage key could not be resolved. Skipping payload persistence.`,
        { identity: String(entity) },
      );
    }

    // 3. Save Metadata (DB)
    try {
      await saver(this.metadataDS, row);
    } catch (dbErr) {
      // DB Save Failed. We must try to ROLLBACK the payload (Best-Effort).
      if (storageKey && payload !== null) {
        this.logger.warn(`DB save failed. Attempting to rollback payload (delete): ${storageKey}`, {
          storageKey,
        });
        try {
          await this.deletePayload(storageKey);
          this.logger.info(`Payload rollback successful: ${storageKey}`, { storageKey });
        } catch (rollbackErr) {
          // Double Fault. Log as WARN and ignore.
          this.logger.warn(`Payload rollback failed. Orphaned file may exist: ${storageKey}`, {
            error: rollbackErr,
            storageKey,
          });
        }
      }
      throw dbErr; // Re-throw the original DB error
    }
  }

  /**
   * メタデータとペイロードの両方を削除します。
   *
   * 処理フロー:
   * 1. (オプション) メタデータをフェッチしてストレージキーを特定
   * 2. ストレージキーが存在する場合、オブジェクトストレージからペイロードを削除 (**DB削除より先に実行**)
   *    - 削除に失敗した場合、エラーをスローして DB 削除を中断（不整合防止）
   * 3. deleter を通じてメタデータを削除
   *
   * @param id - 削除対象の ID
   * @param deleter - メタデータを削除する関数
   * @param metadataFetcher - (オプション) ペイロードを特定するためにメタデータを取得する関数
   */
  protected override async _delete(
    id: string,
    deleter: (ds: TMetadataDataSource) => Promise<void>,
    metadataFetcher?: (ds: TMetadataDataSource) => Promise<TMetadataRow | undefined>,
  ): Promise<void> {
    // 1. Resolve Storage Key & Delete Payload FIRST (to ensure consistency)
    if (metadataFetcher) {
      const metadataRow = await metadataFetcher(this.metadataDS);
      if (metadataRow) {
        const base = this.reconstituteMetadata(metadataRow);
        const storageKey = this.resolveStorageKey(base);
        if (storageKey) {
          try {
            await this.deletePayload(storageKey);
            this.logger.info(`Payload deleted successfully: ${storageKey}`, { storageKey });
          } catch (err) {
            // If payload deletion fails (e.g., network error), we MUST abort to prevent inconsistency.
            // Exception: ObjectNotFoundError (already deleted) is fine.
            if (err instanceof ObjectNotFoundError) {
              this.logger.warn(`Payload not found (already deleted?): ${storageKey}`, {
                storageKey,
              });
            } else {
              this.logger.error(
                `Failed to delete payload. Aborting DB deletion to maintain consistency. Key: ${storageKey}`,
                err as Error,
                { id, storageKey },
              );
              throw err;
            }
          }
        } else {
          this.logger.warn(`No storage key resolved for ID: ${id}. Skipping payload deletion.`);
        }
      }
    }

    // 2. Delete Metadata (Only if payload deletion succeeded)
    await super._delete(id, deleter);
  }

  /**
   * メタデータ行からストレージキーを解決します。
   *
   * @param metadata - 保存または取得したメタデータ行
   * @returns オブジェクトストレージのキー、解決できない場合は null
   */
  protected abstract resolveStorageKey(entity: TBase): string | null;

  /**
   * ベースサマリーとオプションのペイロードから完全なアグリゲートを再構築します。
   *
   * @param base - メタデータから再構築された基本オブジェクト/サマリー
   * @param payload - ストレージから取得したペイロード文字列
   * @returns 完全なアグリゲートオブジェクト
   */
  protected abstract reconstituteAggregate(base: TBase, payload: string | null): TAggregate;

  /**
   * アグリゲートから永続化用のペイロード（MDX等）を抽出・変換します。
   *
   * @param entity - アグリゲートオブジェクト
   * @returns 永続化するペイロード文字列、保存対象がない場合は null
   */
  protected abstract toPersistencePayload(entity: TAggregate): string | null;

  /**
   * ペイロード文字列を永続化します。
   *
   * @param key - ストレージキー
   * @param content - 保存するペイロード内容
   */
  protected abstract persistPayload(key: string, content: string): Promise<void>;

  /**
   * ペイロードを削除します。
   *
   * @param key - 削除対象のストレージキー
   */
  protected abstract deletePayload(key: string): Promise<void>;
}
