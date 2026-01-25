/* eslint-disable @typescript-eslint/no-explicit-any */
import { Work } from '@/domain/work/work';
import { WorkRepository } from '@/domain/work/work.repository';
import { WorkPartRepository } from '@/domain/work/work-part.repository';
import { ComposerRepository } from '@/domain/composer/composer.repository';
import { WorkData } from '@/domain/work/work.schema';
import { WorkPart } from '@/domain/work/work-part';
import { Logger } from '@/shared/logging/logger';
import { AppError } from '@/domain/shared/app-error';

export type CreateWorkCommand = WorkData;

/**
 * CreateWorkUseCase
 * 新規作品作成ユースケース
 *
 * 作曲家の存在チェック、作品の重複チェックを行い、作品と作品パートを作成します。
 */
export class CreateWorkUseCase {
  constructor(
    private workRepo: WorkRepository,
    private workPartRepo: WorkPartRepository,
    private composerRepo: ComposerRepository,
    private logger: Logger,
  ) {}

  /**
   * 作品を新規作成します。
   *
   * @param data 作品データ
   * @throws {AppError} (NOT_FOUND) 指定された作曲家が存在しない場合
   * @throws {AppError} (CONFLICT) 指定されたSlugを持つ作品が既に存在する場合
   */
  async execute(data: CreateWorkCommand): Promise<void> {
    const { composerSlug, slug } = data;

    // 1. Validate Composer Exists & Get ID
    const composer = await this.composerRepo.findBySlug(composerSlug);
    if (!composer) {
      throw new AppError(`Composer not found: ${composerSlug}`, 'NOT_FOUND', 400);
    }
    const composerId = composer.id;

    // 2. Check if Work exists
    const existingWork = await this.workRepo.findBySlug(composerId, slug);
    if (existingWork) {
      throw new AppError(`Work already exists: ${composerSlug}/${slug}`, 'CONFLICT');
    }

    try {
      // 3. Create Work Core
      const workId = crypto.randomUUID();

      const workControl = {
        id: workId,
        slug: slug,
        composerSlug: composerSlug,
        createdAt: new Date(),
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
      this.logger.info(`Created Work Core: ${slug} (${workId})`);

      // 4. Create Parts
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
        this.logger.info(`Created ${partsData.length} parts for work: ${slug}`);
      }
    } catch (err) {
      this.logger.error(`Failed to create work: ${composerSlug}/${slug}`, err as Error);
      throw err;
    }
  }
}
