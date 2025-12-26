import { ContentDetail, ContentSummary } from '@/domain/content/Content';
import { ContentSortOption } from './ContentConstants';

/**
 * コンテンツの検索・フィルタリング条件
 */
export type ContentFilterCriteria = {
    lang: string;
    category: string;
    /** 難易度による絞り込み */
    difficulty?: string;
    /** タグによる絞り込み (複数指定時はAND) */
    tags?: string[];
    /** 検索キーワード (タイトルやタグを対象) */
    keyword?: string;
    /** ソート順 */
    sort?: ContentSortOption;
};

/**
 * コンテンツデータへのアクセスを抽象化するリポジトリインターフェース
 * Clean Architectureの原則に従い、特定のデータソース（ファイルシステム、CMS、DBなど）に依存しない定義とする。
 */
export interface IContentRepository {
    /**
     * 指定されたスラッグに対応するコンテンツ詳細（body含む）を取得する
     * @param slug URLパスの配列 (例: ['bach', 'prelude'])
     */
    getContentDetailBySlug(lang: string, category: string, slug: string[]): Promise<ContentDetail | null>;

    /**
     * 指定された条件に基づいてコンテンツ概要一覧を取得する
     * フィルタリングやソーティングはリポジトリ（インフラ層）の具象クラスで実装される。
     */
    findSummariesByCriteria(criteria: ContentFilterCriteria): Promise<ContentSummary[]>;

    /**
     * 指定された言語・カテゴリのコンテンツ概要一覧（メタデータのみ）を取得する
     * 本文(body)は含まれない。一覧表示やナビゲーション生成などの軽量な処理に使用する。
     */
    getContentSummariesByCategory(lang: string, category: string): Promise<ContentSummary[]>;

    /**
     * 指定された言語・カテゴリの最新コンテンツ概要を指定件数分取得する (Scoped)
     * @param limit 取得件数
     */
    getLatestContentSummariesByCategory(lang: string, category: string, limit: number): Promise<ContentSummary[]>;

    /**
     * 全カテゴリから最新コンテンツ概要を指定件数分取得する (Global)
     * @param limit 取得件数
     */
    getLatestContentSummaries(lang: string, limit: number): Promise<ContentSummary[]>;
}
