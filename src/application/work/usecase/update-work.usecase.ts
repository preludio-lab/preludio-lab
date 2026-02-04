import { Work, WorkControl, WorkMetadata } from '@/domain/work/work';
import { WorkRepository } from '@/domain/work/work.repository';
import { WorkPartRepository } from '@/domain/work/work-part.repository';
import { ComposerRepository } from '@/domain/composer/composer.repository';
import { WorkPart, WorkPartControl, WorkPartMetadata } from '@/domain/work/work-part';
import { UpdateWorkCommand } from '../command/update-work.command';
import { Logger } from '@/shared/logging/logger';
import { AppError } from '@/domain/shared/app-error';
import { generateId } from '@/shared/id';

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
    private workPartRepo: WorkPartRepository,
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

    // 1. Validate Composer Exists & Get ID
    const composer = await this.composerRepo.findBySlug(composerSlug);
    if (!composer) {
      throw new AppError(`Composer not found: ${composerSlug}`, 'NOT_FOUND', 400);
    }
    const composerId = composer.id;

    // 2. Check if Work exists
    const existingWork = await this.workRepo.findBySlug(composerId, slug);
    if (!existingWork) {
      throw new AppError(`Work not found: ${composerSlug}/${slug}`, 'NOT_FOUND');
    }

    try {
      // Transaction Scope
      await this.txManager.transaction(async () => {
        // 3. Update Work Core
        const workId = existingWork.id;

        const workControl: WorkControl = {
          id: workId,
          slug: slug,
          composerSlug: composerSlug,
          createdAt: existingWork.control.createdAt,
          updatedAt: new Date(),
        };

        const existingMeta = existingWork.metadata;

        // Use spread for potentially new data, falling back to existing data if undefined
        // Note: For partial updates, we need to be careful. The command might have partial data?
        // Typically UpdateCommand in this system seems to carry full data replacement or partial.
        // Based on previous code: `data.X ?? existing.X` logic.

        // Let's keep the explicit merge logic for safety but clean it up or keep as is if too complex to spread.
        // Actually, since we want to be safe, let's keep the explicit merge but inside the transaction.
        // Or we can construct it more cleanly.

        const workMetadata: WorkMetadata = {
          ...data, // Spread data first
          // Then manually handle fields that need "existing fallback" if data is undefined
          // But wait, if `data.titleComponents` is undefined, `{...data}` won't have it (or have it as undefined).
          // We need `data.prop ?? existing.prop`.
          // Spread doesn't do `??`.

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

        await this.workRepo.save(workEntity);
        this.logger.info(`Updated Work Core: ${slug} (${workId})`);

        // 4. Update Parts (Delete All & Re-Insert) only if parts are provided
        if (data.parts !== undefined) {
          // Transactional Safety: Now this delete and subsequent inserts are atomic.
          await this.workPartRepo.deleteByWorkId(workId);

          const partsData = data.parts;
          if (partsData.length > 0) {
            const partsEntities: WorkPart[] = partsData.map((p) => {
              const partId = generateId<'WorkPart'>();

              const partControl: WorkPartControl = {
                id: partId,
                workId: workId,
                slug: p.slug,
                order: p.order,
                createdAt: new Date(),
                updatedAt: new Date(),
              };

              const partMetadata: WorkPartMetadata = {
                ...p,
                catalogues: p.catalogues ?? [],
                isNameStandard: p.isNameStandard ?? true,
                tags: p.tags || [],
                musicalIdentity: {
                  genres: p.genres ?? [],
                  key: p.key,
                  tempo: p.tempo,
                  tempoTranslation: p.tempoTranslation,
                  timeSignature: p.timeSignature,
                  bpm: p.bpm,
                  metronomeUnit: p.metronomeUnit,
                },
                nicknames: p.nicknames ?? [],
                instruments: p.instruments ?? [],
              };

              return new WorkPart(partControl, partMetadata);
            });

            // Use saveAll for batch insert
            await this.workPartRepo.saveAll(partsEntities);
            this.logger.info(`Updated (Replaced) ${partsData.length} parts for work: ${slug}`);
          } else {
            this.logger.info(`Removed all parts for work: ${slug}`);
          }
        }
      });
    } catch (err) {
      this.logger.error(`Failed to update work: ${composerSlug}/${slug}`, err as Error);
      throw err;
    }
  }
}
