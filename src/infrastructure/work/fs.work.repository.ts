import fs from 'fs';
import path from 'path';
import { WorkRepository } from '@/domain/work/work.repository';
import { Work, WorkControl } from '@/domain/work/work';
import { WorkMetadataSchema } from '@/domain/work/work.metadata';
import { WorkControlSchema } from '@/domain/work/work.control';
import { MusicalGenre } from '@/domain/shared/musical-genre';
import { TransactionContext } from '@/domain/shared/transaction-manager.interface';
import { serverLogger as logger } from '@/infrastructure/logging/server.logger';

/**
 * File System Implementation of Work Repository
 * JSONファイルを正として作品（Work）マスタを管理する。
 */
export class FsWorkRepository implements WorkRepository {
  private readonly dataDirectory: string;

  constructor() {
    this.dataDirectory = path.join(process.cwd(), 'data/works');
    if (!fs.existsSync(this.dataDirectory)) {
      fs.mkdirSync(this.dataDirectory, { recursive: true });
    }
  }

  async findById(id: string, _ctx?: TransactionContext): Promise<Work | null> {
    const filePath = path.join(this.dataDirectory, `${id}.json`);
    if (fs.existsSync(filePath)) {
      return this.parseWorkFile(filePath);
    }
    return null;
  }

  async findBySlug(
    composerId: string,
    slug: string,
    _ctx?: TransactionContext,
  ): Promise<Work | null> {
    const works = await this.getAllWorks();
    return works.find((w) => w.composerSlug === composerId && w.slug === slug) || null;
  }

  async findMany(
    criteria: { composerId?: string; genre?: string; era?: string },
    _ctx?: TransactionContext,
  ): Promise<Work[]> {
    const works = await this.getAllWorks();
    let filtered = works;

    if (criteria.composerId) {
      filtered = filtered.filter((w) => w.composerSlug === criteria.composerId);
    }
    if (criteria.genre) {
      filtered = filtered.filter((w) =>
        w.metadata.musicalIdentity?.genres.includes(criteria.genre as MusicalGenre),
      );
    }
    if (criteria.era) {
      filtered = filtered.filter((w) => w.metadata.era === criteria.era);
    }

    return filtered;
  }

  async save(work: Work, _ctx?: TransactionContext): Promise<void> {
    const filePath = path.join(this.dataDirectory, `${work.id}.json`);
    const data = {
      control: work.control,
      metadata: work.metadata,
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  async deleteById(id: string, _ctx?: TransactionContext): Promise<void> {
    const filePath = path.join(this.dataDirectory, `${id}.json`);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  private async getAllWorks(): Promise<Work[]> {
    const files = fs.readdirSync(this.dataDirectory).filter((f) => f.endsWith('.json'));
    const works: Work[] = [];
    for (const file of files) {
      const work = await this.parseWorkFile(path.join(this.dataDirectory, file));
      if (work) {
        works.push(work);
      }
    }
    return works;
  }

  private parseWorkFile(filePath: string): Work | null {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(content);

      // Validation
      const control = WorkControlSchema.parse({
        ...data.control,
        createdAt: new Date(data.control.createdAt),
        updatedAt: new Date(data.control.updatedAt),
      }) as unknown as WorkControl;
      const metadata = WorkMetadataSchema.parse(data.metadata);

      return new Work({ control, metadata });
    } catch (e) {
      logger.error('Failed to parse work file', e instanceof Error ? e : new Error(String(e)), {
        filePath,
      });
      return null;
    }
  }
}
