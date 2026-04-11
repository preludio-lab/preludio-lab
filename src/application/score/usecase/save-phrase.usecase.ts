import { Phrase } from '@/domain/score/phrase';
import { PhraseRepository } from '@/domain/score/phrase.repository';
import { AppError } from '@/domain/shared/app-error';
import { consola } from 'consola';

/**
 * フレーズ保存ユースケース
 */
export class SavePhraseUseCase {
  constructor(private phraseRepository: PhraseRepository) {}

  /**
   * フレーズの新規登録・更新を実行します。
   * 内部で Slug から ID へのバリデーション（実在性チェック）が行われます。
   */
  async execute(phrase: Phrase): Promise<void> {
    try {
      consola.info(
        `[SavePhraseUseCase] Saving phrase slug="${phrase.control.slug}" for workSlug="${phrase.metadata.workSlug}"`,
      );

      await this.phraseRepository.upsert(phrase);

      consola.success(`[SavePhraseUseCase] Successfully saved phrase: ${phrase.control.id}`);
    } catch (error) {
      if (error instanceof AppError) {
        consola.warn(`[SavePhraseUseCase] Validation/Integrity error: ${error.message}`);
        throw error;
      }

      consola.error(`[SavePhraseUseCase] Unexpected error during save:`, error);
      throw new AppError(
        'An unexpected error occurred while saving the phrase.',
        'INTERNAL_SERVER_ERROR',
      );
    }
  }
}
