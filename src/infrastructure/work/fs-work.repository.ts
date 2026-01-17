import fs from 'fs';
import path from 'path';
import { WorkRepository, WorkSearchCriteria } from '@/domain/work/work.repository';
import { Work } from '@/domain/work/work';
import { WorkMetadataSchema } from '@/domain/work/work-metadata';
import { WorkControlSchema } from '@/domain/work/work.control';
import { logger } from '@/infrastructure/logging';

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

  async findById(id: string): Promise<Work | null> {
    const filePath = path.join(this.dataDirectory, `${id}.json`);
    if (fs.existsSync(filePath)) {
      return this.parseWorkFile(filePath);
    }
    return null;
  }

  async findBySlug(composerId: string, slug: string): Promise<Work | null> {
    const works = await this.getAllWorks();
    return works.find((w) => w.composer === composerId && w.slug === slug) || null;
  }

  async findMany(criteria: WorkSearchCriteria): Promise<Work[]> {
    let works = await this.getAllWorks();

    if (criteria.composerId) {
      works = works.filter((w) => w.composer === criteria.composerId);
    }
    if (criteria.genre) {
      works = works.filter((w) =>
        w.metadata.musicalIdentity?.genres.includes(criteria.genre as any),
      );
    }
    if (criteria.era) {
      works = works.filter((w) => w.metadata.era === criteria.era);
    }

    const offset = criteria.offset || 0;
    const limit = criteria.limit || 20;

    return works.slice(offset, offset + limit);
  }

  async save(work: Work): Promise<void> {
    const filePath = path.join(this.dataDirectory, `${work.id}.json`);
    const data = {
      control: work.control,
      metadata: work.metadata,
    };
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  async delete(id: string): Promise<void> {
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
      });
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
