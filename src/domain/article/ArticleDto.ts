import { z } from 'zod';
import { ArticleControlSchema } from './ArticleControl';
import { ArticleMetadataSchema, PlaybackSchema, ArticleCategory } from './ArticleMetadata';
import { ArticleContentSchema } from './ArticleContent';
import { ArticleContextSchema } from './ArticleContext';
import { EngagementMetricsSchema } from './ArticleEngagement';

/**
 * Article Metadata DTO (List view)
 * 一覧表示や検索結果、ヒーローセクションなどで使用される軽量モデル。
 * 利便性のため、基本的な識別情報と主要なメタデータをフラットに保持します。
 */
/**
 * ArticleMetadataDtoSchema
 * 一覧表示・カード表示用の軽量なDTOスキーマ。
 * UIでの利便性のため、複数のドメインモデルから必要な情報を「フラット」に集約します。
 */
export const ArticleMetadataDtoSchema = ArticleControlSchema.pick({
    /** 記事のユニークID */
    id: true,
    /** 言語コード (ja, en等) */
    lang: true,
    /** 公開・管理状態 */
    status: true,
}).extend(
    // 音楽的メタデータから、一覧表示に必要な項目を抽出してフラットに展開
    ArticleMetadataSchema.pick({
        /** URLスラグ */
        slug: true,
        /** 記事カテゴリ */
        category: true,
        /** 管理用タイトル */
        title: true,
        /** UI表示用タイトル */
        displayTitle: true,
        /** 作曲家名 */
        composerName: true,
        /** 作品名 */
        workTitle: true,
        /** 抜粋・概要文 */
        excerpt: true,
        /** 推定読了時間 (秒) */
        readingTimeSeconds: true,
        /** 「おすすめ記事」フラグ */
        isFeatured: true,
        /** 音源再生情報 (一覧での試聴用) */
        playback: true,
        /** サムネイル画像URL */
        thumbnail: true,
    }).shape
).extend(
    // エンゲージメント指標から、一覧でのソーシャルプルーフ表示に必要な項目を抽出してマージ
    EngagementMetricsSchema.pick({
        /** 累計閲覧数 (PageView) */
        viewCount: true,
        /** 累計再生数 (Audition) */
        auditionCount: true,
        /** 累計お気に入り数 (Like) */
        likeCount: true,
        /** 累計共鳴数 (Resonance) */
        resonanceCount: true,
        /** 累計シェア数 (SocialShare) */
        shareCount: true,
    }).shape
).extend({
    /** 
     * 正式な公開日時 (ISO8601 string)
     * ドメイン層では Date ですが、JSONとしてやり取りするために文字列形式にしています。
     */
    publishedAt: z.string().nullable(),
});

export type ArticleMetadataDto = z.infer<typeof ArticleMetadataDtoSchema>;

/**
 * Article Search Result DTO
 * 検索結果用。ArticleMetadataDtoに検索関連のスコア情報を追加。
 */
export const ArticleSearchResultDtoSchema = ArticleMetadataDtoSchema.extend({
    /** 検索一致度 / ベクトル類似度 (0.0 〜 1.0) 。主にベクトル検索で使用。 */
    matchScore: z.number().min(0).max(1).optional(),
    /** ヒットした箇所の抜粋。主に全文検索時のハイライト表示に使用。 */
    highlightedText: z.string().optional(),
});

export type ArticleSearchResultDto = z.infer<typeof ArticleSearchResultDtoSchema>;

/**
 * Paged Response
 * ページネーション対応の共通レスポンス
 */
export const PagedResponseSchema = <T extends z.ZodTypeAny>(itemSchema: T) =>
    z.object({
        items: z.array(itemSchema),
        totalCount: z.number().int().nonnegative(),
        hasNextPage: z.boolean(),
        nextCursor: z.string().optional(),
    });

export type PagedResponse<T> = {
    items: T[];
    totalCount: number;
    hasNextPage: boolean;
    nextCursor?: string;
};

/**
 * Article DTO (Detailed)
 * 記事の全情報（本文および全メタデータ）。記事詳細ページ等で使用される。
 * ドメインモデルの各モジュールを包含する集約構造を持ちます。
 */
export const ArticleDtoSchema = z.object({
    /** システム管理情報 (ID, 状態, 作成・更新日) */
    control: ArticleControlSchema,
    /** 音楽的・静的属性 (タイトル, 作曲家, ジャンル等) */
    metadata: ArticleMetadataSchema,
    /** コンテンツ実体 (本文 MDX, 目次構造) */
    content: ArticleContentSchema,
    /** 外部・ビジネス文脈 (参考文献, 収益化要素, 関連記事) */
    context: ArticleContextSchema,
    /** 動的メトリクス (PV, 再生数, いいね等) */
    engagement: EngagementMetricsSchema,
});

export type ArticleDto = z.infer<typeof ArticleDtoSchema>;

