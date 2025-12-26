import { ContentSummary } from '@/domain/content/Content';
import { IContentRepository } from '@/domain/content/ContentRepository';
import { SUPPORTED_CATEGORIES } from '@/domain/content/ContentConstants';

/**
 * Featured Content Selection Criteria
 */
export const FeaturedCriteria = {
    LATEST: 'latest',   // 最新順
    POPULAR: 'popular', // 人気順 (Future)
    RANDOM: 'random',   // ランダム (Future)
} as const;

export type FeaturedCriteria = typeof FeaturedCriteria[keyof typeof FeaturedCriteria];

/**
 * Default number of featured items to display
 */
export const DEFAULT_FEATURED_LIMIT = 3;

export interface GetFeaturedContentInput {
    lang: string;
    criteria?: FeaturedCriteria;
    /**
     * 取得件数
     * @default DEFAULT_FEATURED_LIMIT (3)
     */
    limit?: number;
}

/**
 * 注目のコンテンツ（Featured Content）を取得するユースケース
 * Application層の責務として、複数のカテゴリからデータを集約・選定するロジックを持つ。
 */
export class GetFeaturedContentUseCase {
    constructor(private readonly contentRepository: IContentRepository) { }

    /**
     * Featured Contentを取得する
     * @returns ContentSummary[] (指定件数分の記事配列)
     */
    async execute(input: GetFeaturedContentInput): Promise<ContentSummary[]> {
        const { lang, criteria = FeaturedCriteria.LATEST, limit = DEFAULT_FEATURED_LIMIT } = input;

        switch (criteria) {
            case FeaturedCriteria.LATEST:
                return this.getLatestContents(lang, limit);
            case FeaturedCriteria.POPULAR:
            case FeaturedCriteria.RANDOM:
            default:
                // 未実装のCriteria、またはデフォルトフォールバック
                // 現時点ではLATESTへフォールバックせず、明示的に空を返すか、あるいは将来の実装を待つ
                return [];
        }
    }

    /**
     * 最新のコンテンツを取得する
     */
    private async getLatestContents(lang: string, limit: number): Promise<ContentSummary[]> {
        // Application層のロジックをRepository (Infra) に委譲
        return this.contentRepository.getLatestContentSummaries(lang, limit);
    }
}
