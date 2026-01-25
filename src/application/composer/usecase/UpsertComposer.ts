/* eslint-disable @typescript-eslint/no-explicit-any */
import { Composer } from '@/domain/composer/composer';
import { ComposerRepository } from '@/domain/composer/composer.repository';
import { ComposerData } from '@/domain/composer/composer.schema';
import { AppError } from '@/domain/shared/app-error';
import { Logger } from '@/shared/logging/logger';

export class UpsertComposerUseCase {
  constructor(
    private repository: ComposerRepository,
    private logger: Logger,
  ) {}

  async execute(data: ComposerData): Promise<void> {
    const { slug } = data;

    try {
      // 1. Check existence by slug
      const existing = await this.repository.findBySlug(slug);

      // 2. Prepare Entity
      let entity: Composer;

      const control = {
        slug: data.slug,
        createdAt: existing ? existing.control.createdAt : new Date(),
        updatedAt: new Date(),
        id: existing ? existing.id : crypto.randomUUID(),
      };

      const metadata = {
        fullName: data.fullName,
        displayName: data.displayName,
        shortName: data.shortName,

        era: data.era,
        biography: data.biography,

        birthDate: data.birthDate ? new Date(data.birthDate) : undefined,
        deathDate: data.deathDate ? new Date(data.deathDate) : undefined,
        nationalityCode: data.nationalityCode,

        representativeInstruments: data.representativeInstruments,
        representativeGenres: data.representativeGenres,
        places: data.places,

        portrait: data.portrait,

        impressionDimensions: data.impressionDimensions,
        tags: data.tags,
      };

      if (existing) {
        // Update
        entity = existing.cloneWith({
          control: { ...existing.control, ...control },
          metadata: { ...existing.metadata, ...metadata } as any,
        });
        this.logger.info(`Updating composer: ${slug}`);
      } else {
        // Create
        entity = new Composer({
          control: control as any,
          metadata: metadata as any,
        });
        this.logger.info(`Creating composer: ${slug}`);
      }

      // 3. Save
      await this.repository.save(entity);
    } catch (err) {
      this.logger.error(`Failed to upsert composer: ${slug}`, err as Error);
      throw err;
    }
  }
}
