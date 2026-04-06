import { ScoreSource, ScoreSourceProvider } from '@/domain/score/score-source';
import { ScoreSourceRepository } from '@/domain/score/score-source.repository';
import { GitHubScoreSourceRepository } from './github-score-source.repository';
import { MuseDataScoreSourceRepository } from './musedata-score-source.repository';
import { InfrastructureError } from '@/domain/shared/app-error';

/**
 * プロバイダーに応じて適切なリポジトリに委譲する複合リポジトリ実装
 */
export class MultiProviderScoreSourceRepository implements ScoreSourceRepository {
  private readonly repositories: Record<string, ScoreSourceRepository>;

  constructor() {
    this.repositories = {
      [ScoreSourceProvider.GITHUB]: new GitHubScoreSourceRepository(),
      [ScoreSourceProvider.MUSEDATA]: new MuseDataScoreSourceRepository(),
    };
  }

  async fetchRawScore(source: ScoreSource): Promise<string> {
    const repository = this.repositories[source.provider];
    if (!repository) {
      throw new InfrastructureError(`Unsupported score source provider: ${source.provider}`, false);
    }
    return repository.fetchRawScore(source);
  }

  async findByWorkId(workId: string): Promise<ScoreSource[]> {
    // DB 操作はいずれのリポジトリでも共通（同じ Turso client を使用）
    return this.repositories[ScoreSourceProvider.GITHUB].findByWorkId(workId);
  }

  async findByPartSlug(workId: string, partSlug: string): Promise<ScoreSource | null> {
    return this.repositories[ScoreSourceProvider.GITHUB].findByPartSlug(workId, partSlug);
  }
}
