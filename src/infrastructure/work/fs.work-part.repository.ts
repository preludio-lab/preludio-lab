import fs from 'fs';
import path from 'path';
import { WorkPartRepository } from '@/domain/work/work-part.repository';
import { WorkPart, WorkPartControl } from '@/domain/work/work-part';
import { WorkPartMetadataSchema } from '@/domain/work/work-part.metadata';
import { WorkPartControlSchema } from '@/domain/work/work-part.control';
import { logger } from '@/infrastructure/logging';

/**
 * File System Implementation of WorkPart Repository
 */
export class FsWorkPartRepository implements WorkPartRepository {
  private readonly dataDirectory: string;

  constructor() {
    this.dataDirectory = path.join(process.cwd(), 'data/work_parts');
    if (!fs.existsSync(this.dataDirectory)) {
      fs.mkdirSync(this.dataDirectory, { recursive: true });
    }
  }

  async findById(id: string): Promise<WorkPart | null> {
    const filePath = path.join(this.dataDirectory, `${id}.json`);
    if (fs.existsSync(filePath)) {
      return this.parsePartFile(filePath);
    }
    return null;
  }

  async findByWorkId(workId: string): Promise<WorkPart[]> {
    const files = fs.readdirSync(this.dataDirectory).filter((f) => f.endsWith('.json'));
    const parts: WorkPart[] = [];
    for (const file of files) {
      const part = await this.parsePartFile(path.join(this.dataDirectory, file));
      if (part && part.workId === workId) {
        parts.push(part);
      }
    }
    return parts.sort((a, b) => a.order - b.order);
  }

  async save(part: WorkPart): Promise<void> {
    const filePath = path.join(this.dataDirectory, `${part.id}.json`);
    const data = {
      control: part.control,
      metadata: part.metadata,
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  async delete(id: string): Promise<void> {
    const filePath = path.join(this.dataDirectory, `${id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  async deleteByWorkId(workId: string): Promise<void> {
    const parts = await this.findByWorkId(workId);
    for (const part of parts) {
      await this.delete(part.id);
    }
  }

  private parsePartFile(filePath: string): WorkPart | null {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);

      const control = WorkPartControlSchema.parse({
        ...data.control,
        createdAt: new Date(data.control.createdAt),
        updatedAt: new Date(data.control.updatedAt),
      }) as unknown as WorkPartControl;
      const metadata = WorkPartMetadataSchema.parse(data.metadata);

      return new WorkPart(control, metadata);
    } catch (e) {
      logger.error(
        'Failed to parse work part file',
        e instanceof Error ? e : new Error(String(e)),
        { filePath },
      );
      return null;
    }
  }
}
