import { WorkPartRepository } from '@/domain/work/work-part.repository';
import { WorkPart } from '@/domain/work/work-part';
import { IWorkDataSource } from './interfaces/work.ds.interface';
import { TursoWorkPartMapper } from './turso.work-part.mapper';
import { AppError } from '@/domain/shared/app-error';
import { TransactionContext } from '@/domain/shared/transaction-manager.interface';

export class WorkPartRepositoryImpl implements WorkPartRepository {
  constructor(private workDS: IWorkDataSource) {}

  /**
   * 指定されたIDのWorkPart（楽章）を取得します。
   */
  async findById(id: string, ctx?: TransactionContext): Promise<WorkPart | null> {
    try {
      const rows = await this.workDS.findPartById(id, ctx);
      if (!rows) return null;
      return TursoWorkPartMapper.toDomain(rows);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Database error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  async findByWorkId(workId: string, ctx?: TransactionContext): Promise<WorkPart[]> {
    try {
      const workRows = await this.workDS.findById(workId, ctx);
      if (!workRows) return [];

      // workRows.parts は WorkPartRows[] 型
      // undefined チェックを行います。
      if (!workRows.parts) return [];

      return workRows.parts.map(TursoWorkPartMapper.toDomain);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Database error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  async save(part: WorkPart, ctx?: TransactionContext): Promise<void> {
    try {
      const rows = TursoWorkPartMapper.toPersistence(part);
      await this.workDS.savePart(rows, ctx);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Database save error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  async saveAll(parts: WorkPart[], ctx?: TransactionContext): Promise<void> {
    try {
      const rowsList = parts.map(TursoWorkPartMapper.toPersistence);
      await this.workDS.saveParts(rowsList, ctx);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Database batch save error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }

  /**
   * 指定されたIDのWorkPart（楽章）を削除します。
   */
  async deleteById(id: string, ctx?: TransactionContext): Promise<void> {
    try {
      await this.workDS.deletePartById(id, ctx);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Database delete error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }
  async deleteByWorkId(workId: string, ctx?: TransactionContext): Promise<void> {
    try {
      await this.workDS.deletePartsByWorkId(workId, ctx);
    } catch (err) {
      if (err instanceof AppError) throw err;
      throw new AppError('Database delete error', 'INFRASTRUCTURE_ERROR', 500, err);
    }
  }
}
