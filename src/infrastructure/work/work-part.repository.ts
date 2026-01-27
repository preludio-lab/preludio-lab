import { WorkPartRepository } from '@/domain/work/work-part.repository';
import { WorkPart } from '@/domain/work/work-part';
import { IWorkDataSource } from './interfaces/work.ds.interface';
import { TursoWorkPartMapper } from './turso.work-part.mapper';
import { AppError } from '@/domain/shared/app-error';

export class WorkPartRepositoryImpl implements WorkPartRepository {
  constructor(private workDS: IWorkDataSource) {}

  async findById(_id: string): Promise<WorkPart | null> {
    // Current DS doesn't expose findPartById directly.
    // If needed, we must add it to DS.
    // Or we scan? No.
    // Implementing findById for Part is secondary for SEEDING.
    // Seeding uses deleteByWorkId + save.
    // But interface requires it.
    // I will throw unimplemented or implement efficiently if easy.
    // DS structure is Work-Centric.
    // I will throw "Method not implemented" for findById if not critical.
    // Or add `findPartById` to DS.
    throw new Error('Method not implemented.');
  }

  async findByWorkId(workId: string): Promise<WorkPart[]> {
    try {
      const workRows = await this.workDS.findById(workId);
      if (!workRows) return [];

      // workRows.parts is WorkPartRows[]
      // workRows.parts is optional (as per recent change).
      // Check undefined.
      if (!workRows.parts) return [];

      return workRows.parts.map(TursoWorkPartMapper.toDomain);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Database error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  async save(part: WorkPart): Promise<void> {
    try {
      const rows = TursoWorkPartMapper.toPersistence(part);
      await this.workDS.savePart(rows);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Database save error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  async delete(_id: string): Promise<void> {
    throw new Error('Method not implemented.');
  }

  async deleteByWorkId(workId: string): Promise<void> {
    try {
      await this.workDS.deletePartsByWorkId(workId);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Database delete error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }
}
