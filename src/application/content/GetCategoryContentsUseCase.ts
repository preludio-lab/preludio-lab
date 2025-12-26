import { ContentSummary } from '@/domain/content/Content';
import { IContentRepository, ContentFilterCriteria } from '@/domain/content/ContentRepository';

export interface GetCategoryContentsInput {
    lang: string;
    category: string;
    difficulty?: string;
    tags?: string[];
    keyword?: string;
    sort?: ContentFilterCriteria['sort'];
}

/**
 * 指定されたカテゴリのコンテンツ一覧を取得するユースケース
 * フィルタリングやソート条件をドメイン層のリポジトリに渡し、
 * 抽象化されたデータアクセスを実行する。
 */
export class GetCategoryContentsUseCase {
    constructor(private readonly contentRepository: IContentRepository) { }

    /**
     * コンテンツ一覧を取得する
     * @param input 取得条件
     * @returns ContentSummary[]
     */
    async execute(input: GetCategoryContentsInput): Promise<ContentSummary[]> {
        const { lang, category, difficulty, tags, keyword, sort = 'latest' } = input;

        // リポジトリが期待する Criteria 形式に変換
        const criteria: ContentFilterCriteria = {
            lang,
            category,
            difficulty,
            tags,
            keyword,
            sort,
        };

        // データの取得とフィルタリング・ソートの実装をリポジトリに委譲
        // これにより、将来的にSQLクエリや外部APIに切り替える際もユースケースは変更不要となる
        return this.contentRepository.findSummariesByCriteria(criteria);
    }
}
