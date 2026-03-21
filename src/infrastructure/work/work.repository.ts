import { WorkRepository } from '@/domain/work/work.repository';
import { Work } from '@/domain/work/work';
import { IWorkDataSource } from './interfaces/work.ds.interface';
import { IComposerDataSource } from '@/infrastructure/composer/interfaces/composer.ds.interface';
import { TursoWorkMapper } from './turso.work.mapper';
import { AppError } from '@/domain/shared/app-error';
import { TransactionContext } from '@/domain/shared/transaction-manager.interface';
import { serverLogger as logger } from '@/infrastructure/logging/server.logger';

export class WorkRepositoryImpl implements WorkRepository {
  constructor(
    private workDS: IWorkDataSource,
    private composerDS: IComposerDataSource,
  ) {}

  async findById(id: string, ctx?: TransactionContext): Promise<Work | null> {
    try {
      const rows = await this.workDS.findById(id, ctx);
      if (!rows) return null;
      return TursoWorkMapper.toDomain(rows);
    } catch (err) {
      logger.error(`[WorkRepository.findById] Error: ${id}`, err as Error);
      if (err instanceof AppError) throw err;
      throw new AppError('Database error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  async findBySlug(
    composerId: string,
    slug: string,
    ctx?: TransactionContext,
  ): Promise<Work | null> {
    try {
      const rows = await this.workDS.findBySlug(composerId, slug, ctx);
      if (!rows) return null;
      return TursoWorkMapper.toDomain(rows);
    } catch (err) {
      logger.error(`[WorkRepository.findBySlug] Error: ${composerId}/${slug}`, err as Error);
      if (err instanceof AppError) throw err;
      throw new AppError('Database error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  async findMany(
    _criteria: { composerId?: string; genre?: string; era?: string },
    _ctx?: TransactionContext,
  ): Promise<Work[]> {
    // 参照系（一覧）は SearchWorksUseCase / WorkQueryService が担当するため、
    // 集約リストを必要とするドメイン要件があるまで未実装とします。
    return [];
  }

  async save(work: Work, ctx?: TransactionContext): Promise<void> {
    try {
      // 1. Resolve Composer ID
      const composerSlug = work.composerSlug;
      if (!composerSlug) {
        throw new AppError('Work must have a composer slug', 'VALIDATION_ERROR', 400);
      }

      const composerRows = await this.composerDS.findBySlug(composerSlug, ctx);
      if (!composerRows) {
        throw new AppError(`Composer not found: ${composerSlug}`, 'VALIDATION_ERROR', 400);
      }

      const composerId = composerRows.composer.id;

      // 2. Map to Persistence
      const { work: workRow, translations } = TursoWorkMapper.toPersistence(work);
      workRow.composerId = composerId;

      // 3. Save (Parts excluded)
      await this.workDS.save(
        {
          work: workRow,
          translations,
          parts: undefined, // Explicitly undefined to preserve parts
        },
        ctx,
      );
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Database save error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  async deleteById(id: string, ctx?: TransactionContext): Promise<void> {
    try {
      await this.workDS.deleteById(id, ctx);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Database delete error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }
}
