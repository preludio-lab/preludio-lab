import { z } from 'zod';

// Define the Metadata schema (Runtime Validation)
/**
 * コンテンツのメタデータ (Zodスキーマ)
 * ※ArticleMetadata との重複に注意し、旧来のContent用として最小構成を維持
 */
export const MetadataSchema = z.object({
  /** UI上に表示されるタイトル */
  title: z.string(),
  /** 作曲家名 (例: J.S. Bach) */
  composerName: z.string().optional(),
  /** 作品タイトル (例: Well-Tempered Clavier Book I) */
  work: z.string().optional(),
  /** 楽曲の調性 (例: C Major) */
  key: z.string().optional(),
  /** 難易度ラベル (旧仕様: Beginner / Intermediate / Advanced) */
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  /** 検索用タグの配列 */
  tags: z.array(z.string()).optional(),
  /** 音源ソースの識別子 (YouTube ID等) */
  audioSrc: z.string().optional(),
  /** 演奏者・演奏団体名 */
  performer: z.string().optional(),
  /** 記事のサムネイル画像URL */
  thumbnail: z.string().optional(),
  /** 再生開始位置 (秒) */
  startSeconds: z.number().optional(),
  /** 再生終了位置 (秒) */
  endSeconds: z.number().optional(),
  /** SEO・SNS用の抜粋テキスト */
  ogp_excerpt: z.string().optional(),
  /** 公開日時または更新日 (YYYY-MM-DD) */
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
