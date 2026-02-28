import { ComposerListDto } from '../dto/composer.dto';
import { ComposerRepository } from '@/domain/composer/composer.repository';
import { MusicalEra } from '@/domain/shared/musical-era';

/**
 * 作曲家一覧取得 ユースケース
 */
export class GetComposersUseCase {
  constructor(private readonly composerRepository: ComposerRepository) {}

  async execute(params: { limit: number; offset: number }): Promise<{
    composers: ComposerListDto[];
    totalCount: number;
  }> {
    const composers = await this.composerRepository.findMany({
      limit: params.limit,
      offset: params.offset,
    });

    // TODO: DB等からTotalCountを取得する仕組みが必要。
    // 現状のRepository InterfaceにはCountがないため、暫定的に取得件数または別途カウントロジックを検討
    const totalCount = composers.length; // 暫定

    return {
      composers: composers.map((composer) => ({
        id: composer.id,
        slug: composer.slug,
        name:
          (typeof composer.displayName === 'object'
            ? composer.displayName?.ja
            : composer.displayName) ||
          (typeof composer.fullName === 'object' ? composer.fullName?.ja : composer.fullName) ||
          'Unknown',
        era: (composer.era as MusicalEra) || undefined,
        worksCount: 0, // 今後のDataSource拡張で取得
      })),
      totalCount,
    };
  }
}
