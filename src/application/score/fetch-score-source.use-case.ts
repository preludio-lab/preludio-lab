import { ScoreSourceRepository } from '@/domain/score/score-source.repository';
import { ScoreSource } from '@/domain/score/score-source';
import { AppError, InfrastructureError } from '@/domain/shared/app-error';
import { serverLogger as logger } from '@/infrastructure/logging/server.logger';

/**
 * 楽譜原本取得ユースケース
 * 特定の楽曲・楽章のソース情報を取得し、外部リポジトリ（GitHub等）から原本データをフェッチします。
 */
export class FetchScoreSourceUseCase {
  constructor(private readonly scoreSourceRepository: ScoreSourceRepository) {}

  /**
   * 楽曲・楽章を指定して楽譜原本を取得する
   */
  async execute(params: { workId: string; partSlug: string }): Promise<{
    content: string;
    source: ScoreSource;
  }> {
    const { workId, partSlug } = params;

    // 1. ソース情報の取得 (DB)
    const source = await this.scoreSourceRepository.findByPartSlug(workId, partSlug);

    if (!source) {
      throw new AppError(
        `Score source not found for work: ${workId}, part: ${partSlug}`,
        'NOT_FOUND',
        404,
      );
    }

    try {
      // 2. 原本データのフェッチ (Infrastructure via Repository)
      logger.info('Fetching raw score content...', {
        workId,
        partSlug,
        provider: source.provider,
        commit: source.commitHash,
      });

      const content = await this.scoreSourceRepository.fetchRawScore(source);

      return {
        content,
        source,
      };
    } catch (error: unknown) {
      // InfrastructureError 等は既に適切にラップされている想定
      const isTransient = error instanceof InfrastructureError ? error.isTransient : false;
      logger.error(
        'Failed to fetch score content in UseCase',
        error instanceof Error ? error : new Error(String(error)),
        {
          workId,
          partSlug,
          isTransient,
        },
      );
      throw error;
    }
  }
}
