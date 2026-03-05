import { ComposerDto, ComposerDtoInput, ComposerDtoSchema } from '../dto/composer.dto';
import { ComposerRepository } from '@/domain/composer/composer.repository';
import { AppError } from '@/domain/shared/app-error';

/**
 * 作曲家詳細取得 ユースケース
 */
export class GetComposerBySlugUseCase {
  constructor(private readonly composerRepository: ComposerRepository) {}

  async execute(slug: string): Promise<ComposerDto> {
    const composer = await this.composerRepository.findBySlug(slug);

    if (!composer) {
      throw new AppError(`Composer with slug '${slug}' not found`, 'NOT_FOUND', 404);
    }

    // TODO: 7ヶ国語の翻訳データ、関連作品プレビュー等を取得・マージする処理は
    // インフラ層の拡張（IComposerDataSource / Mapper）完了後に実装

    const rawData: ComposerDtoInput = {
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
      era: composer.era || null,
      birthDate: composer.birthDate || null,
      deathDate: composer.deathDate || null,
      nationalityCode: composer.nationalityCode || null,
      portrait: composer.portrait || null,
      representativeInstruments: composer.representativeInstruments,
      representativeGenres: composer.representativeGenres,
      places: composer.places.map((p) => ({
        slug: p.slug,
        type: p.type,
        countryCode: p.countryCode,
      })),
      tags: composer.tags,
      impressionDimensions: composer.impressionDimensions,
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
      createdAt: composer.control.createdAt,
      updatedAt: composer.control.updatedAt,
    };

    return ComposerDtoSchema.parse(rawData);
  }
}
