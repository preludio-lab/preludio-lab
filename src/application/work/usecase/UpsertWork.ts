/* eslint-disable @typescript-eslint/no-explicit-any */
import { Work } from '@/domain/work/work';
import { WorkRepository } from '@/domain/work/work.repository';
import { WorkPartRepository } from '@/domain/work/work-part.repository';
import { ComposerRepository } from '@/domain/composer/composer.repository';
import { WorkData } from '@/domain/work/work.schema';
import { WorkPart } from '@/domain/work/work-part';
import { Logger } from '@/shared/logging/logger';
import { AppError } from '@/domain/shared/app-error';

export class UpsertWorkUseCase {
  constructor(
    private workRepo: WorkRepository,
    private workPartRepo: WorkPartRepository,
    private composerRepo: ComposerRepository,
    private logger: Logger,
  ) {}

  async execute(data: WorkData): Promise<void> {
    const { composerSlug, slug } = data;

    try {
      // 1. Validate Composer Exists & Get ID (needed? workRepo resolves it too, but we might want explicit check)
      const composer = await this.composerRepo.findBySlug(composerSlug);
      if (!composer) {
        throw new AppError(`Composer not found: ${composerSlug}`, 'NOT_FOUND', 400);
      }
      const composerId = composer.id;

      // 2. Resolve Work (Find existing)
      const existingWork = await this.workRepo.findBySlug(composerId, slug);

      // 3. Upsert Work Core
      const workId = existingWork ? existingWork.id : crypto.randomUUID();

      const workControl = {
        id: workId,
        slug: slug,
        composerSlug: composerSlug,
        createdAt: existingWork ? existingWork.control.createdAt : new Date(),
        updatedAt: new Date(),
      };

      // WorkData likely has these fields if it matches WorkMetadata.
      // Casting to any to avoid TS errors if interface inference is slightly off or strict.
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
      this.logger.info(`Upserted Work Core: ${slug} (${workId})`);

      // 4. Upsert Parts
      // Strategy: Delete all existing parts and re-insert logic from JSON.
      // This ensures 1:1 sync with JSON source.

      await this.workPartRepo.deleteByWorkId(workId);

      const partsData = data.parts || [];
      if (partsData.length > 0) {
        for (const p of partsData) {
          const pData = p as any;
          const partId = crypto.randomUUID();

          const partEntity = new WorkPart(
            {
              id: partId,
              workId: workId, // partEntity control expects workId
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
        this.logger.info(`Upserted ${partsData.length} parts for work: ${slug}`);
      }
    } catch (err) {
      this.logger.error(`Failed to upsert work: ${composerSlug}/${slug}`, err as Error);
      throw err;
    }
  }
}
