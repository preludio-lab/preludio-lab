import { Composer, ComposerControl, ComposerMetadata } from '@/domain/composer/composer';
import { ComposerRepository } from '@/domain/composer/composer.repository';
import { CreateComposerCommand } from '../command/create-composer.command';
import { Logger } from '@/shared/logging/logger';
import { AppError } from '@/domain/shared/app-error';
import { generateId } from '@/shared/id';
import { TransactionManager } from '@/domain/shared/transaction-manager.interface';

/**
 * CreateComposerUseCase
 * 新規作曲家作成ユースケース
 *
 * 既存のSlugチェックを行い、存在しない場合に新規作成を行います。
 */
export class CreateComposerUseCase {
  constructor(
    private repository: ComposerRepository,
    private txManager: TransactionManager,
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

    await this.txManager.transaction(async () => {
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
        ...command,
        birthDate: command.birthDate ? new Date(command.birthDate) : undefined,
        deathDate: command.deathDate ? new Date(command.deathDate) : undefined,
        representativeInstruments: command.representativeInstruments ?? [],
        representativeGenres: command.representativeGenres ?? [],
        places: command.places ?? [],
      };

      const entity = new Composer({
        control,
        metadata,
      });

      await this.repository.save(entity);
    });

    this.logger.info('Created Composer', { slug });
  }
}
