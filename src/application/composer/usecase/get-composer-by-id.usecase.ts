import { ComposerDto, ComposerDtoInput, ComposerDtoSchema } from '../dto/composer.dto';
import { ComposerRepository } from '@/domain/composer/composer.repository';
import { AppError } from '@/domain/shared/app-error';

/**
 * 作曲家詳細取得（IDベース） ユースケース
 */
export class GetComposerByIdUseCase {
  constructor(private readonly composerRepository: ComposerRepository) {}

  async execute(id: string): Promise<ComposerDto> {
    const composer = await this.composerRepository.findById(id);

    if (!composer) {
      throw new AppError(`Composer with ID '${id}' not found`, 'NOT_FOUND', 404);
    }

    const rawData: ComposerDtoInput = {
      id: composer.id,
      slug: composer.slug,
      name:
        (typeof composer.displayName === 'object'
          ? composer.displayName?.ja
          : composer.displayName) ||
        (typeof composer.fullName === 'object' ? composer.fullName?.ja : composer.fullName) ||
        'Unknown',
      summary:
        (typeof composer.summary === 'object' ? composer.summary?.ja : composer.summary) || null,
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
          summary:
            (typeof composer.summary === 'object' ? composer.summary?.ja : composer.summary) ||
            null,
        },
      },
      relatedWorks: [],
      createdAt: composer.control.createdAt,
      updatedAt: composer.control.updatedAt,
    };

    return ComposerDtoSchema.parse(rawData);
  }
}
