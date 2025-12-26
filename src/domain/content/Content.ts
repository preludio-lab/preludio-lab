import { z } from 'zod';

// Define the Metadata schema (Runtime Validation)
export const MetadataSchema = z.object({
    /** 記事のタイトル (h1として表示) */
    title: z.string(),
    /** 作曲者名 (例: J.S. Bach) */
    composer: z.string().optional(),
    /** 作品名 (大分類。例: Well-Tempered Clavier Book I) */
    work: z.string().optional(),
    /** 調性 (例: C Major) */
    key: z.string().optional(),
    /** 難易度 (Beginner / Intermediate / Advanced) */
    difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
    /** 検索用タグの配列 */
    tags: z.array(z.string()).optional(),
    /** 音源ソース (例: YouTube ID) */
    audioSrc: z.string().optional(),
    /** 演奏者名 (例: Glenn Gould)。指定がない場合は動画タイトル等から推測されない */
    performer: z.string().optional(),
    /** アルバムアートワークのパス */
    artworkSrc: z.string().optional(),
    /** コンテンツのサムネイル画像URL (Hero/List表示用) */
    thumbnail: z.string().optional(),
    /** 再生開始位置 (秒) */
    startSeconds: z.number().optional(),
    /** 再生終了位置 (秒) */
    endSeconds: z.number().optional(),
    /** OGP画像生成用の抜粋テキスト (指定がない場合は本文冒頭が使われる想定) */
    ogp_excerpt: z.string().optional(),
    /** 記事の公開日または更新日 (YYYY-MM-DD) */
    date: z.string().optional(),
});

export type Metadata = z.infer<typeof MetadataSchema>;

/**
 * コンテンツの概要（本文を含まない）
 * 一覧表示やナビゲーションに使用
 */
export type ContentSummary = {
    /** URLの一意な識別子 (例: "bach/prelude")。カテゴリフォルダ (content/[lang]/[category]) からの相対パス。 */
    slug: string;
    /** 言語コード (例: "en", "ja") */
    lang: string;
    /** コンテンツのカテゴリ (例: "works", "articles") */
    category: string;
    /** 記事のメタデータ (Zodスキーマで検証済み) */
    metadata: Metadata;
};

/**
 * コンテンツの詳細（本文を含む）
 * 記事詳細ページで使用
 */
export type ContentDetail = ContentSummary & {
    /** 記事の本文 (MDX形式の生テキスト) */
    body: string;
};


