import { ScoreSource } from '@/domain/score/score-source';
import { ScoreSourceRepository } from '@/domain/score/score-source.repository';
import { InfrastructureError } from '@/domain/shared/app-error';
import { db } from '@/infrastructure/database/turso.client';
import * as schema from '@/infrastructure/database/schema';
import { eq, and } from 'drizzle-orm';
import { R2StorageService } from '@/infrastructure/storage/r2.storage';

/**
 * Cloudflare R2 をデータソースとする楽譜ソースリポジトリの実装
 * 手動調達されたデータや、GitHub 等からバックアップされた不変データを扱う。
 */
export class R2ScoreSourceRepository implements ScoreSourceRepository {
  private readonly storage: R2StorageService;

  constructor() {
    // 楽譜データは 'private/scores/' プレフィックス配下に配置される運用とする
    this.storage = new R2StorageService(undefined, 'private/scores/');
  }

  async fetchRawScore(source: ScoreSource): Promise<string> {
    try {
      const content = await this.storage.get(source.filePath);
      if (!content) {
        throw new InfrastructureError(
          `Score not found in R2: ${source.filePath}`,
          false,
          undefined,
          404,
        );
      }
      return content;
    } catch (error: unknown) {
      if (error instanceof InfrastructureError) throw error;
      throw new InfrastructureError(
        `Failed to fetch score from R2: ${source.filePath}`,
        false,
        error instanceof Error ? error : undefined,
      );
    }
  }

  async findByWorkId(workId: string): Promise<ScoreSource[]> {
    const results = await db.query.scoreSources.findMany({
      where: eq(schema.scoreSources.workId, workId),
      orderBy: (sources, { asc }) => [asc(sources.workPartNumber)],
    });

    return results as unknown as ScoreSource[];
  }

  async findByPartSlug(workId: string, partSlug: string): Promise<ScoreSource | null> {
    const result = await db.query.scoreSources.findFirst({
      where: and(
        eq(schema.scoreSources.workId, workId),
        eq(schema.scoreSources.workPartSlug, partSlug),
      ),
    });

    return (result as unknown as ScoreSource) || null;
  }
}
