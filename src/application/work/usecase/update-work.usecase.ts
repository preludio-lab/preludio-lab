/* eslint-disable @typescript-eslint/no-explicit-any */
import { Work } from '@/domain/work/work';
import { WorkRepository } from '@/domain/work/work.repository';
import { WorkPartRepository } from '@/domain/work/work-part.repository';
import { ComposerRepository } from '@/domain/composer/composer.repository';
import { WorkData } from '@/domain/work/work.schema';
import { WorkPart } from '@/domain/work/work-part';
import { Logger } from '@/shared/logging/logger';
import { AppError } from '@/domain/shared/app-error';

export type UpdateWorkCommand = WorkData;

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

      const workControl = {
        id: workId,
        slug: slug,
        composerSlug: composerSlug,
        createdAt: existingWork.control.createdAt,
        updatedAt: new Date(),
      };

      const d = data as any;
      const workMetadata = {
        titleComponents: d.titleComponents,
        catalogues: d.catalogues,
        era: d.era,
        instrumentation: d.instrumentation,
        instrumentationFlags: d.instrumentationFlags,
        performanceDifficulty: d.performanceDifficulty,
        musicalIdentity: d.musicalIdentity,
        impressionDimensions: d.impressionDimensions,
        compositionYear: d.compositionYear,
        compositionPeriod: d.compositionPeriod,
        nicknames: d.nicknames,
        description: d.description,
        tags: d.tags,
        basedOn: d.basedOn,
      };

      const workEntity = new Work({
        control: workControl as any,
        metadata: workMetadata as any,
      });

      await this.workRepo.save(workEntity);
      this.logger.info(`Updated Work Core: ${slug} (${workId})`);

      // 4. Update Parts (Delete All & Re-Insert)
      await this.workPartRepo.deleteByWorkId(workId);

      const partsData = data.parts || [];
      if (partsData.length > 0) {
        for (const p of partsData) {
          const pData = p as any;
          const partId = crypto.randomUUID();

          const partEntity = new WorkPart(
            {
              id: partId,
              workId: workId,
              slug: pData.slug,
              order: pData.order,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any,
            {
              titleComponents: pData.titleComponents,
              catalogues: pData.catalogues,
              type: pData.type,
              isNameStandard: pData.isNameStandard,
              description: pData.description,
              musicalIdentity: pData.musicalIdentity,
              impressionDimensions: pData.impressionDimensions,
              nicknames: pData.nicknames,
              basedOn: pData.basedOn,
              performanceDifficulty: pData.performanceDifficulty,
            } as any,
          );

          await this.workPartRepo.save(partEntity);
        }
        this.logger.info(`Updated (Replaced) ${partsData.length} parts for work: ${slug}`);
      }
    } catch (err) {
      this.logger.error(`Failed to update work: ${composerSlug}/${slug}`, err as Error);
      throw err;
    }
  }
}
