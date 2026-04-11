import { Phrase, PhraseId } from '@/domain/score/phrase';
import { PhraseRepository } from '@/domain/score/phrase.repository';
import { IPhraseDataSource } from './interfaces/phrase.ds.interface';
import { TursoPhraseMapper } from './turso.phrase.mapper';
import { IWorkDataSource } from '../work/interfaces/work.ds.interface';
import { IComposerDataSource } from '../composer/interfaces/composer.ds.interface';
import { IScoreDataSource } from './interfaces/score.ds.interface';
import { AppError } from '@/domain/shared/app-error';

export class PhraseRepositoryImpl implements PhraseRepository {
  constructor(
    private phraseDataSource: IPhraseDataSource,
    private workDataSource: IWorkDataSource,
    private composerDataSource: IComposerDataSource,
    private scoreDataSource: IScoreDataSource,
  ) {}

  async findById(id: PhraseId): Promise<Phrase | null> {
    const rows = await this.phraseDataSource.findById(id);
    if (!rows) return null;
    return TursoPhraseMapper.toDomain(rows);
  }

  async findByWorkSlug(workSlug: string): Promise<Phrase[]> {
    const rowsList = await this.phraseDataSource.findByWorkSlug(workSlug);
    return rowsList.map((rows) => TursoPhraseMapper.toDomain(rows));
  }

  async upsert(phrase: Phrase): Promise<void> {
    const { phrase: phraseRow, translations } = TursoPhraseMapper.toPersistence(phrase);

    const meta = phrase.metadata;

    // 1. Slug -> ID Resolution (Hybrid Strategy)
    if (meta.workSlug) {
      let composerId = '';
      if (meta.composerSlug) {
        const composerRows = await this.composerDataSource.findBySlug(meta.composerSlug);
        if (composerRows) {
          composerId = composerRows.composer.id;
        }
      }

      // Hybrid Strategy: Resolve composerId first then find work by slug
      const workRows = await this.workDataSource.findBySlug(composerId, meta.workSlug);
      if (!workRows) {
        throw new AppError(
          `Work with slug "${meta.workSlug}" not found (for composer "${meta.composerSlug}").`,
          'NOT_FOUND',
        );
      }
      phraseRow.workId = workRows.work.id;

      if (meta.workPartSlug) {
        const part = workRows.parts?.find((p) => p.part.slug === meta.workPartSlug);
        if (part) {
          phraseRow.workPartId = part.part.id;
        } else {
          throw new AppError(
            `WorkPart with slug "${meta.workPartSlug}" not found in work "${meta.workSlug}".`,
            'NOT_FOUND',
          );
        }
      }
    } else {
      if (!phraseRow.workId) {
        throw new AppError(
          'workSlug is required for creating/updating a phrase.',
          'VALIDATION_ERROR',
        );
      }
    }

    if (meta.scoreSlug) {
      const scoreRows = await this.scoreDataSource.findBySlug(meta.scoreSlug);
      if (scoreRows) {
        phraseRow.scoreId = scoreRows.score.id;
      }
    }

    // 2. Persist
    await this.phraseDataSource.upsert({
      phrase: phraseRow,
      translations,
    });
  }

  async deleteById(id: PhraseId): Promise<void> {
    await this.phraseDataSource.deleteById(id);
  }

  async findMany(limit?: number, offset?: number): Promise<Phrase[]> {
    const rows = await this.phraseDataSource.findMany(limit, offset);
    return rows.map((row) => TursoPhraseMapper.toDomain(row));
  }
}
