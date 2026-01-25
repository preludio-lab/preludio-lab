import { ComposerControl, ComposerMetadata } from '@/domain/composer/composer';
import { ComposerRepository } from '@/domain/composer/composer.repository';
import { ComposerData } from '@/domain/composer/composer.schema';
import { Logger } from '@/shared/logging/logger';
import { AppError } from '@/domain/shared/app-error';

export type UpdateComposerCommand = ComposerData;

/**
 * UpdateComposerUseCase
 * 既存作曲家更新ユースケース
 *
 * 既存のSlugチェックを行い、存在する場合に更新を行います。
 */
export class UpdateComposerUseCase {
  constructor(
    private repository: ComposerRepository,
    private logger: Logger,
  ) {}

  /**
   * 既存の作曲家情報を更新します。
   *
   * @param command 作曲家データ
   * @throws {AppError} (NOT_FOUND) 指定されたSlugを持つ作曲家が存在しない場合
   */
  async execute(command: UpdateComposerCommand): Promise<void> {
    const { slug } = command;

    const existing = await this.repository.findBySlug(slug);
    if (!existing) {
      throw new AppError(`Composer not found: ${slug}`, 'NOT_FOUND');
    }

    const control: Partial<ComposerControl> = {
      slug: command.slug,
      createdAt: existing.control.createdAt,
      updatedAt: new Date(),
      id: existing.id,
    };

    const metadata: Partial<ComposerMetadata> = {
      fullName: command.fullName,
      displayName: command.displayName,
      shortName: command.shortName,

      era: command.era,
      biography: command.biography,

      birthDate: command.birthDate ? new Date(command.birthDate) : undefined,
      deathDate: command.deathDate ? new Date(command.deathDate) : undefined,
      nationalityCode: command.nationalityCode,

      representativeInstruments: command.representativeInstruments ?? [],
      representativeGenres: command.representativeGenres ?? [],
      places: command.places ?? [],

      portrait: command.portrait,

      impressionDimensions: command.impressionDimensions,
      tags: command.tags,
    };

    const entity = existing.cloneWith({
      control,
      metadata,
    });

    await this.repository.save(entity);
    this.logger.info(`Updating composer: ${slug}`);
  }
}
