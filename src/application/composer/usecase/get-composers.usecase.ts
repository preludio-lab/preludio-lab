import {
  LocalizedComposerDto,
  LocalizedComposerDtoInput,
  LocalizedComposerDtoSchema,
} from '../dto/localized-composer.dto';
import { ComposerRepository } from '@/domain/composer/composer.repository';

/**
 * 作曲家一覧取得 ユースケース
 */
export class GetComposersUseCase {
  constructor(private readonly composerRepository: ComposerRepository) {}

  async execute(params: { limit: number; offset: number; lang?: string }): Promise<{
    composers: LocalizedComposerDto[];
    totalCount: number;
  }> {
    const composers = await this.composerRepository.findMany({
      limit: params.limit,
      offset: params.offset,
    });

    // TODO: DB等からTotalCountを取得する仕組みが必要。
    // 現状のRepository InterfaceにはCountがないため、暫定的に取得件数または別途カウントロジックを検討
    const totalCount = composers.length; // 暫定

    const lang = params.lang || 'ja';

    return {
      composers: composers.map((composer) => {
        const displayName = composer.displayName;
        const fullName = composer.fullName;

        let localizedName = 'Unknown';
        if (typeof displayName === 'object') {
          localizedName =
            (displayName as Record<string, string>)[lang] || displayName?.ja || 'Unknown';
        } else if (displayName) {
          localizedName = displayName as unknown as string;
        } else if (typeof fullName === 'object') {
          localizedName = (fullName as Record<string, string>)[lang] || fullName?.ja || 'Unknown';
        } else if (fullName) {
          localizedName = fullName as unknown as string;
        }

        const rawData: LocalizedComposerDtoInput = {
          id: composer.id,
          slug: composer.slug,
          name: localizedName,
          era: composer.era || null,
          worksCount: 0, // 今後のDataSource拡張で取得
          nationalityCode: composer.nationalityCode,
          portrait: composer.portrait,
          updatedAt: composer.control.updatedAt,
        };

        return LocalizedComposerDtoSchema.parse(rawData);
      }),
      totalCount,
    };
  }
}
