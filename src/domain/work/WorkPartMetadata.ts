import { z } from '@/shared/validation/zod';
import {
  TitleSchema,
  DescriptionSchema,
  MusicalIdentitySchema,
  PerformanceDifficultySchema,
  NicknamesSchema,
  ImpressionDimensionsSchema,
} from './WorkShared';

/**
 * Work Part Metadata
 * 楽章や構成楽曲の属性情報
 */
export const WorkPartMetadataSchema = z.object({
  /** 楽章名・パーツタイトル */
  title: TitleSchema,
  /** 補足説明 */
  description: DescriptionSchema.optional(),

  /** 演奏難易度 (Taxonomy準拠 1-5) */
  performanceDifficulty: PerformanceDifficultySchema.optional(),

  /** 音楽的アイデンティティ */
  musicalIdentity: MusicalIdentitySchema.optional(),

  /** 感性・印象評価の6軸データ */
  impressionDimensions: ImpressionDimensionsSchema.optional(),

  /** 検索用別名リスト */
  nicknames: NicknamesSchema.default([]),
});

export type WorkPartMetadata = z.infer<typeof WorkPartMetadataSchema>;
