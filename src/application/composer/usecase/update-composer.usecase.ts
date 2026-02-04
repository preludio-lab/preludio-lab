import { ComposerControl, ComposerMetadata } from '@/domain/composer/composer';
import { ComposerRepository } from '@/domain/composer/composer.repository';
import { UpdateComposerCommand } from '../command/update-composer.command';
import { Logger } from '@/shared/logging/logger';
import { AppError } from '@/domain/shared/app-error';
import { TransactionManager } from '@/domain/shared/transaction-manager.interface';

/**
 * UpdateComposerUseCase
 * 既存作曲家更新ユースケース
 *
 * 既存のSlugチェックを行い、存在する場合に更新を行います。
 */
export class UpdateComposerUseCase {
  constructor(
    private repository: ComposerRepository,
    private txManager: TransactionManager,
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

    await this.txManager.run(async (ctx) => {
      const existing = await this.repository.findBySlug(slug, ctx);
      if (!existing) {
        throw new AppError(`Composer not found: ${slug}`, 'NOT_FOUND');
      }

      const control: Partial<ComposerControl> = {
        ...existing.control,
        slug: command.slug,
        updatedAt: new Date(),
      };

      const metadata: Partial<ComposerMetadata> = {
        ...command,
        birthDate: command.birthDate ? new Date(command.birthDate) : undefined,
        deathDate: command.deathDate ? new Date(command.deathDate) : undefined,
        representativeInstruments: command.representativeInstruments ?? [],
        representativeGenres: command.representativeGenres ?? [],
        places: command.places ?? [],
      };

      const entity = existing.cloneWith({
        control,
        metadata,
      });

      await this.repository.save(entity, ctx);
    });

    this.logger.info('Updated Composer', { slug });
  }
}
