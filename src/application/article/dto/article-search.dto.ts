import { z } from 'zod';
import { ArticleListItemDtoSchema } from './article-list.dto';

/**
 * Article Search Meta DTO
 * 検索結果に付与されるメタ情報（スコア、ハイライト等）
 */
export const ArticleSearchMetaDtoSchema = z.object({
  /** マッチ度 / ベクトル類似度 (0.0 〜 1.0) */
  matchScore: z.number().min(0).max(1).optional(),
  /** ヒットした箇所の抜粋。主に全文検索時のハイライト表示に使用。 */
  highlightedText: z.string().optional(),
});

export type ArticleSearchMetaDto = z.infer<typeof ArticleSearchMetaDtoSchema>;

/**
 * Article Search Suggestion DTO
 * 検索窓のオートコンプリートなどで使う、極めて軽量なDTO。
 */
export const ArticleSearchSuggestionDtoSchema = ArticleListItemDtoSchema.pick({
  id: true,
  displayTitle: true,
  composerName: true,
  slug: true,
});

export type ArticleSearchSuggestionDto = z.infer<typeof ArticleSearchSuggestionDtoSchema>;

/**
 * Article Search Result Item DTO
 * 検索結果の1アイテム。記事データと検索メタ情報を包含（Composition）する。
 * ベースとなる記事情報は ArticleListItemDto を使用（検索結果には詳細情報も含まれることが多いため）。
 */
export const ArticleSearchResultItemDtoSchema = z.object({
  /** 記事本体のメタデータ */
  article: ArticleListItemDtoSchema, // Search usually returns full metadata for filtering/display
  /** 検索ヒット情報 */
  search: ArticleSearchMetaDtoSchema,
});

export type ArticleSearchResultItemDto = z.infer<typeof ArticleSearchResultItemDtoSchema>;

/**
 * Article Search Result List DTO
 * 検索結果のリストレスポンス。
 */
export const ArticleSearchResultListDtoSchema = z.object({
  items: z.array(ArticleSearchResultItemDtoSchema),
  totalCount: z.number(),
  hasNextPage: z.boolean(),
  nextCursor: z.string().nullable(),
});

export type ArticleSearchResultListDto = z.infer<typeof ArticleSearchResultListDtoSchema>;
