import {
  Composer,
  ComposerControl,
  ComposerMetadata,
  ComposerId,
} from '@/domain/composer/composer';
import { ComposerRepository } from '@/domain/composer/composer.repository';
import { CreateComposerCommand } from '../command/create-composer.command';
import { Logger } from '@/shared/logging/logger';
import { AppError } from '@/domain/shared/app-error';
import { generateId } from '@/shared/id';

// CreateComposerCommand is now imported from command file

/**
 * CreateComposerUseCase
 * 新規作曲家作成ユースケース
 *
 * 既存のSlugチェックを行い、存在しない場合に新規作成を行います。
 */
export class CreateComposerUseCase {
  constructor(
    private repository: ComposerRepository,
    private logger: Logger,
  ) {}

  /**
   * 作曲家を新規作成します。
   *
   * @param command 作曲家データ
   * @throws {AppError} (CONFLICT) 指定されたSlugを持つ作曲家が既に存在する場合
   */
  async execute(command: CreateComposerCommand): Promise<void> {
    const { slug } = command;

    const existing = await this.repository.findBySlug(slug);
    if (existing) {
      throw new AppError(`Composer already exists: ${slug}`, 'CONFLICT');
    }

    const control: ComposerControl = {
      slug: command.slug,
      createdAt: new Date(),
      updatedAt: new Date(),
      id: generateId<'Composer'>(),
    };

    const metadata: ComposerMetadata = {
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

    const entity = new Composer({
      control,
      metadata,
    });

    await this.repository.save(entity);
    this.logger.info(`Creating composer: ${slug}`);
  }
}
