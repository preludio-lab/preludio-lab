import { ComposerDetailDto } from '../dto/composer.dto';
import { ComposerRepository } from '@/domain/composer/composer.repository';
import { AppError } from '@/domain/shared/app-error';
import { MusicalEra } from '@/domain/shared/musical-era';

/**
 * 作曲家詳細取得 ユースケース
 */
export class GetComposerBySlugUseCase {
  constructor(private readonly composerRepository: ComposerRepository) {}

  async execute(slug: string): Promise<ComposerDetailDto> {
    const composer = await this.composerRepository.findBySlug(slug);

    if (!composer) {
      throw new AppError(`Composer with slug '${slug}' not found`, 'NOT_FOUND', 404);
    }

    // TODO: 7ヶ国語の翻訳データ、関連作品プレビュー等を取得・マージする処理は
    // インフラ層の拡張（IComposerDataSource / Mapper）完了後に実装

    return {
      id: composer.id,
      slug: composer.slug,
      name:
        (typeof composer.displayName === 'object'
          ? composer.displayName?.ja
          : composer.displayName) ||
        (typeof composer.fullName === 'object' ? composer.fullName?.ja : composer.fullName) ||
        'Unknown',
      biography:
        (typeof composer.biography === 'object' ? composer.biography?.ja : composer.biography) ||
        null,
      era: (composer.era as MusicalEra) || undefined,
      birthDate: composer.birthDate ? composer.birthDate.toISOString() : null,
      deathDate: composer.deathDate ? composer.deathDate.toISOString() : null,
      nationalityCode: composer.nationalityCode || null,
      translations: {
        ja: {
          fullName:
            (typeof composer.fullName === 'object' ? composer.fullName?.ja : composer.fullName) ||
            '',
          displayName:
            (typeof composer.displayName === 'object'
              ? composer.displayName?.ja
              : composer.displayName) ||
            (typeof composer.fullName === 'object' ? composer.fullName?.ja : composer.fullName) ||
            '',
          shortName:
            (typeof composer.shortName === 'object'
              ? composer.shortName?.ja
              : composer.shortName) || '',
          biography:
            (typeof composer.biography === 'object'
              ? composer.biography?.ja
              : composer.biography) || null,
        },
      },
      relatedWorks: [],
      updatedAt: composer.control.updatedAt.toISOString(),
    };
  }
}
