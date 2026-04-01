import { ScoreSource } from '@/domain/score/score-source';
import { ScoreSourceRepository } from '@/domain/score/score-source.repository';
import { InfrastructureError } from '@/domain/shared/app-error';
import { db } from '@/infrastructure/database/turso.client';
import * as schema from '@/infrastructure/database/schema';
import { eq, and } from 'drizzle-orm';
import { serverLogger as logger } from '@/infrastructure/logging/server.logger';

/**
 * GitHub をデータソースとする楽譜ソースリポジトリの実装
 */
export class GitHubScoreSourceRepository implements ScoreSourceRepository {
  private readonly ALLOWED_DOMAIN = 'raw.githubusercontent.com';
  private readonly TIMEOUT_MS = 5000;
  private readonly MAX_RETRIES = 3;

  /**
   * GitHub Raw URL から原本データを取得する
   */
  async fetchRawScore(source: ScoreSource): Promise<string> {
    const { repositoryOwner, repositoryName, commitHash, filePath, format } = source;

    if (!repositoryOwner || !repositoryName) {
      throw new InfrastructureError('GitHub repository owner or name is missing', false);
    }

    // SSRF 対策: 接続先ドメインを制限
    const url = `https://${this.ALLOWED_DOMAIN}/${repositoryOwner}/${repositoryName}/${commitHash}/${filePath}`;

    let lastError: Error | unknown;
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
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
          const isTransient = response.status === 503 || response.status === 429;
          throw new InfrastructureError(
            `Failed to fetch score from GitHub: ${response.statusText} (${response.status})`,
            isTransient,
            undefined,
            response.status,
          );
        }

        const content = await response.text();

        // コンテンツの正当性検証 (Integrity Check)
        this.validateContentSignature(content, format);

        return content;
      } catch (error: unknown) {
        lastError = error;
        const isTransient = this.isTransientError(error);

        if (!isTransient || attempt === this.MAX_RETRIES) {
          break;
        }

        // 指数バックオフ
        const delay = Math.pow(2, attempt) * 1000;
        logger.warn(`Retrying fetch score (${attempt}/${this.MAX_RETRIES}) after ${delay}ms...`, {
          url,
        });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    if (lastError instanceof InfrastructureError) {
      throw lastError;
    }

    throw new InfrastructureError(
      `Failed to fetch score after ${this.MAX_RETRIES} attempts: ${url}`,
      this.isTransientError(lastError),
      lastError instanceof Error ? lastError : undefined,
    );
  }

  private isTransientError(error: unknown): boolean {
    if (!error || typeof error !== 'object') return false;
    const isTimeout = 'name' in error && (error as { name: string }).name === 'AbortError';
    const isNetworkError = error instanceof TypeError;
    const isTransientInfra = error instanceof InfrastructureError && error.isTransient;
    return isTimeout || isNetworkError || isTransientInfra;
  }

  /**
   * 楽曲に関連するすべてのソースを取得する（DB層）
   */
  async findByWorkId(workId: string): Promise<ScoreSource[]> {
    const results = await db.query.scoreSources.findMany({
      where: eq(schema.scoreSources.workId, workId),
      orderBy: (sources, { asc }) => [asc(sources.workPartNumber)],
    });

    return results as ScoreSource[];
  }

  /**
   * 特定の楽章のソースを取得する（DB層）
   */
  async findByPartSlug(workId: string, partSlug: string): Promise<ScoreSource | null> {
    const result = await db.query.scoreSources.findFirst({
      where: and(
        eq(schema.scoreSources.workId, workId),
        eq(schema.scoreSources.workPartSlug, partSlug),
      ),
    });

    return (result as ScoreSource) || null;
  }

  /**
   * コンテンツが期待されるフォーマットのシグネチャを持っているか検証する
   */
  private validateContentSignature(content: string, format: string): void {
    const trimmed = content.trim();
    if (trimmed.startsWith('<!DOCTYPE html') || trimmed.startsWith('<html')) {
      throw new InfrastructureError('Fetched content is HTML, possibly an error page.', false);
    }

    switch (format) {
      case 'kern':
        if (!trimmed.includes('!!COM') && !trimmed.includes('**kern')) {
          throw new InfrastructureError('Invalid Kern format signature', false);
        }
        break;
      case 'musicxml':
      case 'mxl':
        if (!trimmed.startsWith('<?xml') && !trimmed.includes('<score-partwise')) {
          // Caution: .mxl is binary (zipped), text check might fail if not unzipped.
          // Architecture docs mention Phase 3 will handle unzipping.
          // For now, we assume raw .xml or .krn.
          if (format === 'musicxml') {
            throw new InfrastructureError('Invalid MusicXML format signature', false);
          }
        }
        break;
    }
  }
}
