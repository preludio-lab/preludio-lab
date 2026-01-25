import { ComposerRepository, ComposerSearchCriteria } from '@/domain/composer/composer.repository';
import { Composer } from '@/domain/composer/composer';
import { IComposerDataSource } from './interfaces/composer.ds.interface';
import { TursoComposerMapper } from './turso.composer.mapper';
import { AppError } from '@/domain/shared/app-error';

export class ComposerRepositoryImpl implements ComposerRepository {
  constructor(private ds: IComposerDataSource) {}

  async findById(id: string): Promise<Composer | null> {
    try {
      const rows = await this.ds.findById(id);
      if (!rows) return null;
      return TursoComposerMapper.toDomain(rows);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Database error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  async findBySlug(slug: string): Promise<Composer | null> {
    try {
      const rows = await this.ds.findBySlug(slug);
      if (!rows) return null;
      return TursoComposerMapper.toDomain(rows);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Database error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findByIds(ids: string[]): Promise<Composer[]> {
    throw new Error('Method not implemented.');
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findMany(criteria?: ComposerSearchCriteria): Promise<Composer[]> {
    throw new Error('Method not implemented.');
  }

  async save(composer: Composer): Promise<void> {
    try {
      const rows = TursoComposerMapper.toPersistence(composer);
      await this.ds.save(rows);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Database save error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await this.ds.delete(id);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Database delete error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }
}
