import { Work, WorkControl, WorkMetadata } from '@/domain/work/work';
import { WorkRepository } from '@/domain/work/work.repository';
import { WorkPartRepository } from '@/domain/work/work-part.repository';
import { ComposerRepository } from '@/domain/composer/composer.repository';
import { WorkPart, WorkPartControl, WorkPartMetadata } from '@/domain/work/work-part';
import { UpdateWorkCommand } from '../command/update-work.command';
import { Logger } from '@/shared/logging/logger';
import { AppError } from '@/domain/shared/app-error';
import { generateId } from '@/shared/id';

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
      // 3. Update Work Core
      const workId = existingWork.id;

      const workControl: WorkControl = {
        id: workId,
        slug: slug,
        composerSlug: composerSlug,
        createdAt: existingWork.control.createdAt,
        updatedAt: new Date(),
      };

      const workMetadata: WorkMetadata = {
        titleComponents: data.titleComponents ?? existingWork.metadata.titleComponents,
        catalogues: data.catalogues ?? existingWork.metadata.catalogues,
        era: data.era ?? existingWork.metadata.era,
        instrumentation: data.instrumentation ?? existingWork.metadata.instrumentation,
        instrumentationFlags:
          data.instrumentationFlags ?? existingWork.metadata.instrumentationFlags,
        performanceDifficulty:
          data.performanceDifficulty ?? existingWork.metadata.performanceDifficulty,
        musicalIdentity: {
          genres: data.genres ?? existingWork.metadata.musicalIdentity?.genres ?? [],
          key: data.key ?? existingWork.metadata.musicalIdentity?.key,
          tempo: data.tempo ?? existingWork.metadata.musicalIdentity?.tempo,
          tempoTranslation:
            data.tempoTranslation ?? existingWork.metadata.musicalIdentity?.tempoTranslation,
          timeSignature: data.timeSignature ?? existingWork.metadata.musicalIdentity?.timeSignature,
          bpm: data.bpm ?? existingWork.metadata.musicalIdentity?.bpm,
          metronomeUnit: data.metronomeUnit ?? existingWork.metadata.musicalIdentity?.metronomeUnit,
        },
        impressionDimensions:
          data.impressionDimensions ?? existingWork.metadata.impressionDimensions,
        compositionYear: data.compositionYear ?? existingWork.metadata.compositionYear,
        compositionPeriod: data.compositionPeriod ?? existingWork.metadata.compositionPeriod,
        nicknames: data.nicknames ?? existingWork.metadata.nicknames,
        description: data.description ?? existingWork.metadata.description,
        tags: data.tags ?? existingWork.metadata.tags,
        basedOn: data.basedOn ?? existingWork.metadata.basedOn,
      };

      const workEntity = new Work({
        control: workControl,
        metadata: workMetadata,
      });

      await this.workRepo.save(workEntity);
      this.logger.info(`Updated Work Core: ${slug} (${workId})`);

      // 4. Update Parts (Delete All & Re-Insert) only if parts are provided
      if (data.parts !== undefined) {
        await this.workPartRepo.deleteByWorkId(workId);
        const partsData = data.parts;
        if (partsData.length > 0) {
          for (const p of partsData) {
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
              titleComponents: p.titleComponents,
              catalogues: p.catalogues ?? [],
              type: p.type,
              isNameStandard: p.isNameStandard ?? true,
              description: p.description,
              musicalIdentity: {
                genres: p.genres ?? [],
                key: p.key,
                tempo: p.tempo,
                tempoTranslation: p.tempoTranslation,
                timeSignature: p.timeSignature,
                bpm: p.bpm,
                metronomeUnit: p.metronomeUnit,
              },
              impressionDimensions: p.impressionDimensions,
              nicknames: p.nicknames ?? [],
              basedOn: p.basedOn,
              performanceDifficulty: p.performanceDifficulty,
            };

            const partEntity = new WorkPart(partControl, partMetadata);

            await this.workPartRepo.save(partEntity);
          }
          this.logger.info(`Updated (Replaced) ${partsData.length} parts for work: ${slug}`);
        } else {
          this.logger.info(`Removed all parts for work: ${slug}`);
        }
      }
    } catch (err) {
      this.logger.error(`Failed to update work: ${composerSlug}/${slug}`, err as Error);
      throw err;
    }
  }
}
