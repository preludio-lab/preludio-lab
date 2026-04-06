import { ScoreSource } from '@/domain/score/score-source';
import { ScoreSourceRepository } from '@/domain/score/score-source.repository';
import { InfrastructureError } from '@/domain/shared/app-error';
import { db } from '@/infrastructure/database/turso.client';
import * as schema from '@/infrastructure/database/schema';
import { eq, and } from 'drizzle-orm';
import { serverLogger as logger } from '@/infrastructure/logging/server.logger';

/**
 * old.musedata.org をデータソースとする楽譜ソースリポジトリの実装
 */
export class MuseDataScoreSourceRepository implements ScoreSourceRepository {
  private readonly BASE_URL = 'http://old.musedata.org';
  private readonly TIMEOUT_MS = 10000; // CGI 実行のため少し長めに設定

  /**
   * MuseData CGI から原本データを取得する
   */
  async fetchRawScore(source: ScoreSource): Promise<string> {
    const { filePath, format } = source;

    // filePath は 'cgi-bin/mddata?composer=mozart&...' の形式を想定
    const url = `${this.BASE_URL}/${filePath}`;

    try {
      logger.info('Fetching raw score from MuseData...', { url });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'PreludioLab-ScoreFetcher/1.0',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new InfrastructureError(
          `Failed to fetch score from MuseData: ${response.statusText} (${response.status}) at ${url}`,
          response.status === 503 || response.status === 429,
          undefined,
          response.status,
        );
      }

      const content = await response.text();

      // コンテンツの正当性検証 (簡易)
      if (format === 'kern' && !content.includes('**kern')) {
        throw new InfrastructureError('Invalid Kern format signature from MuseData', false);
      }

      return content;
    } catch (error: unknown) {
      if (error instanceof InfrastructureError) throw error;

      const isTimeout = (error as { name?: string })?.name === 'AbortError';
      throw new InfrastructureError(
        `Network error while fetching from MuseData: ${url}`,
        isTimeout || error instanceof TypeError,
        error instanceof Error ? error : undefined,
      );
    }
  }

  /**
   * DB層の実装はプロバイダーに依存しないため GitHub 実装と共有可能だが、
   * 今回はシンプルに重複させる。
   */
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
