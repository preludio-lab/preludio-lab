import { AppLocale } from '../i18n/Locale';
import { ArticleStatus } from './ArticleConstants';

/**
 * Article Control
 * 記事の基本識別情報とライフサイクル管理。
 * glossary: ArticleControl に対応
 */
export type ArticleControl = {
    /** 記事のユニークID (システム内部用) */
    readonly id: string;
    /** 言語コード */
    readonly lang: AppLocale;
    /** 公開・管理状態 */
    readonly status: ArticleStatus;
    /** 記事の作成日時 */
    readonly createdAt: Date;
    /** 記事の最終更新日時 */
    readonly updatedAt: Date;
    /** 正式な公開日時 */
    readonly publishedAt: Date | null;
};
