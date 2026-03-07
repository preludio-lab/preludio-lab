import { Composer, ComposerControl, ComposerMetadata } from '@/domain/composer/composer';
import { ComposerRepository } from '@/domain/composer/composer.repository';
import { ComposerMaster } from '../master/composer-master.schema';
import { Logger } from '@/shared/logging/logger';
import { generateId } from '@/shared/id';
import { TransactionManager } from '@/domain/shared/transaction-manager.interface';

/**
 * SyncComposersUseCase
 * 作曲家マスターデータの同期ユースケース。
 *
 * Gitの差分情報をベースに、追加・変更されたデータの一括更新（Upsert）と、
 * 削除されたデータの一括削除（Purge）を単一トランザクションで実行します。
 */
export class SyncComposersUseCase {
  constructor(
    private repository: ComposerRepository,
    private txManager: TransactionManager,
    private logger: Logger,
  ) {}

  /**
   * 同期処理を実行します。
   *
   * @param params
   * @param params.upsertList 追加・変更対象のマスターデータリスト
   * @param params.deleteSlugs 削除対象のスラグリスト
   */
  async execute(params: { upsertList: ComposerMaster[]; deleteSlugs: string[] }): Promise<void> {
    const { upsertList, deleteSlugs } = params;

    if (upsertList.length === 0 && deleteSlugs.length === 0) {
      this.logger.info('No changes to sync.');
      return;
    }

    await this.txManager.run(async (ctx) => {
      // 1. 削除処理 (Purge)
      if (deleteSlugs.length > 0) {
        await this.repository.deleteBySlugs(deleteSlugs, ctx);
        this.logger.info(`Purged ${deleteSlugs.length} composers from DB.`, { deleteSlugs });
      }

      // 2. 更新・作成処理 (Upsert)
      if (upsertList.length > 0) {
        // 大規模更新時のパフォーマンス最適化：
        // 1件ずつ findBySlug するのではなく、対象のスラグのみをバルク取得して Map に格納。
        const upsertSlugs = upsertList.map((d) => d.slug);
        const existingComposers = await this.repository.findBySlugs(upsertSlugs, ctx);

        const existingMap = new Map(existingComposers.map((c) => [c.slug, c]));
        const entities: Composer[] = [];

        for (const data of upsertList) {
          const existing = existingMap.get(data.slug);

          const control: ComposerControl = {
            id: existing?.id ?? generateId<'Composer'>(),
            slug: data.slug,
            createdAt: existing?.control.createdAt ?? new Date(),
            updatedAt: new Date(),
          };

          const metadata: ComposerMetadata = {
            ...data,
            birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
            deathDate: data.deathDate ? new Date(data.deathDate) : undefined,
            representativeInstruments: data.representativeInstruments ?? [],
            representativeGenres: data.representativeGenres ?? [],
            places: data.places ?? [],
          };

          entities.push(new Composer({ control, metadata }));
        }

        await this.repository.saveMany(entities, ctx);
        this.logger.info(`Upserted ${entities.length} composers to DB.`);
      }
    });

    this.logger.info('Master data sync completed successfully.');
  }
}
