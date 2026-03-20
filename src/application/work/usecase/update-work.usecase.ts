import { Work, WorkControl, WorkMetadata } from '@/domain/work/work';
import { WorkRepository } from '@/domain/work/work.repository';
import { ComposerRepository } from '@/domain/composer/composer.repository';
import { UpdateWorkCommand } from '../command/update-work.command';
import { Logger } from '@/shared/logging/logger';
import { AppError } from '@/domain/shared/app-error';

import { TransactionManager } from '@/domain/shared/transaction-manager.interface';

// UpdateWorkCommand is now imported from command file

/**
 * UpdateWorkUseCase
 * 既存作品更新ユースケース
 *
 * 作曲家の存在チェック、作品の存在チェックを行い、作品情報と作品パートを更新します。
 * パート情報は全削除後に再挿入(Re-Insert)されます。
 */

export class UpdateWorkUseCase {
  constructor(
    private workRepo: WorkRepository,
    private composerRepo: ComposerRepository,
    private txManager: TransactionManager,
    private logger: Logger,
  ) {}

  /**
   * 既存の作品を更新します。
   *
   * @param data 作品データ
   * @throws {AppError} (NOT_FOUND) 指定された作曲家または作品が存在しない場合
   */
  async execute(data: UpdateWorkCommand): Promise<void> {
    const { composerSlug, slug } = data;

    /** 1. 作曲家の存在確認とIDの取得 */
    const composer = await this.composerRepo.findBySlug(composerSlug);
    if (!composer) {
      throw new AppError(`Composer not found: ${composerSlug}`, 'NOT_FOUND', 400);
    }
    const composerId = composer.id;

    /** 2. 作品の存在チェック */
    const existingWork = await this.workRepo.findBySlug(composerId, slug);
    if (!existingWork) {
      throw new AppError(`Work not found: ${composerSlug}/${slug}`, 'NOT_FOUND');
    }

    try {
      /** トランザクション範囲 */
      await this.txManager.run(async (ctx) => {
        /** 3. 作品本体の更新 */
        const workId = existingWork.id;

        const workControl: WorkControl = {
          id: workId,
          slug: slug,
          composerSlug: composerSlug,
          createdAt: existingWork.control.createdAt,
          updatedAt: new Date(),
        };

        const existingMeta = existingWork.metadata;

        /**
         * 新しいデータの反映にあたり、値が未定義の場合は既存データを保持します。
         * Note: 部分更新の際、Commandが部分的なデータのみを持つ可能性があるため。
         * システム内のUpdateCommandは通常、完全な置き換えまたは部分的な更新を想定しています。
         */

        /**
         * 安全性を期すため、明示的なマージロジックを維持します。
         * または、より簡潔に構築することも可能です。
         */

        const workMetadata: WorkMetadata = {
          ...data /** データをまずスプレッド */,
          /**
           * dataがundefinedの場合に既存データをフォールバックとして使用するフィールドを個別に制御。
           * Note: data.prop が undefined の場合、スプレッド構文だけでは既存値を維持できないため
           * `data.prop ?? existing.prop` の形式を併用します。
           */

          titleComponents: data.titleComponents ?? existingMeta.titleComponents,
          catalogues: data.catalogues ?? existingMeta.catalogues,
          era: data.era ?? existingMeta.era,
          instrumentation: data.instrumentation ?? existingMeta.instrumentation,
          instruments: data.instruments ?? existingMeta.instruments,
          instrumentationFlags: data.instrumentationFlags ?? existingMeta.instrumentationFlags,
          performanceDifficulty: data.performanceDifficulty ?? existingMeta.performanceDifficulty,
          musicalIdentity: {
            genres: data.genres ?? existingMeta.musicalIdentity?.genres ?? [],
            key: data.key ?? existingMeta.musicalIdentity?.key,
            tempo: data.tempo ?? existingMeta.musicalIdentity?.tempo,
            tempoTranslation:
              data.tempoTranslation ?? existingMeta.musicalIdentity?.tempoTranslation,
            timeSignature: data.timeSignature ?? existingMeta.musicalIdentity?.timeSignature,
            bpm: data.bpm ?? existingMeta.musicalIdentity?.bpm,
            metronomeUnit: data.metronomeUnit ?? existingMeta.musicalIdentity?.metronomeUnit,
          },
          impressionDimensions: data.impressionDimensions ?? existingMeta.impressionDimensions,
          compositionYear: data.compositionYear ?? existingMeta.compositionYear,
          compositionPeriod: data.compositionPeriod ?? existingMeta.compositionPeriod,
          nicknames: data.nicknames ?? existingMeta.nicknames,
          description: data.description ?? existingMeta.description,
          tags: data.tags ?? existingMeta.tags,
          basedOn: data.basedOn ?? existingMeta.basedOn,
        };

        const workEntity = new Work({
          control: workControl,
          metadata: workMetadata,
        });

        await this.workRepo.save(workEntity, ctx);
        this.logger.info(`Updated Work Core`, { slug, workId });
      });
    } catch (err) {
      this.logger.error(`Failed to update work`, err as Error, { composerSlug, slug });
      throw err;
    }
  }
}
