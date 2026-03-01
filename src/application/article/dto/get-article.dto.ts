import { z } from 'zod';
import { ArticleSchema } from '@/domain/article/article.schema';

/**
 * Article Detail DTO
 * 記事の全情報（本文および全メタデータ）。記事詳細ページ等で使用される。
 * ドメインモデルの ArticleSchema をベースに、必要な変換（Date -> stringなど）を行います。
 * 現状はドメインスキーマとほぼ等価ですが、シリアライズ要件に応じて拡張可能です。
 */
export const ArticleDtoSchema = ArticleSchema; // Currently direct mapping, but separated for conceptual layering

export type ArticleDto = z.infer<typeof ArticleDtoSchema>;
