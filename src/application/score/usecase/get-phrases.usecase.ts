import { Phrase } from '@/domain/score/phrase';
import { PhraseId } from '@/domain/score/phrase.control';
import { PhraseRepository } from '@/domain/score/phrase.repository';
import { AppError } from '@/domain/shared/app-error';

/**
 * フレーズ取得ユースケース
 */
export class GetPhrasesUseCase {
  constructor(private phraseRepository: PhraseRepository) {}

  /**
   * ID による単一フレーズの取得
   */
  async getById(id: PhraseId): Promise<Phrase> {
    const phrase = await this.phraseRepository.findById(id);
    if (!phrase) {
      throw new AppError(`Phrase with ID "${id}" not found.`, 'NOT_FOUND');
    }
    return phrase;
  }

  /**
   * 楽曲スラグに基づくフレーズ一覧の取得
   */
  async getByWorkSlug(workSlug: string): Promise<Phrase[]> {
    return this.phraseRepository.findByWorkSlug(workSlug);
  }

  /**
   * 全フレーズの取得
   */
  async getAll(limit?: number, offset?: number): Promise<Phrase[]> {
    return this.phraseRepository.findMany(limit, offset);
  }
}

/**
 * フレーズ削除ユースケース
 */
export class DeletePhraseUseCase {
  constructor(private phraseRepository: PhraseRepository) {}

  async execute(id: PhraseId): Promise<void> {
    const existing = await this.phraseRepository.findById(id);
    if (!existing) {
      throw new AppError(`Phrase with ID "${id}" to delete not found.`, 'NOT_FOUND');
    }

    await this.phraseRepository.deleteById(id);
  }
}
