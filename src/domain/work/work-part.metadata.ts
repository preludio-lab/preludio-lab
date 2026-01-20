import { z } from '@/shared/validation/zod';
import { SlugSchema } from '../shared/common.metadata';
import {
  DescriptionSchema,
  MusicalIdentitySchema,
  PerformanceDifficultySchema,
  NicknamesSchema,
  ImpressionDimensionsSchema,
  TitleComponentsSchema,
  CatalogueSchema,
  ArrangeTypeSchema,
} from './work.shared';

/**
 * Work Part Type
 * 楽章や構成楽曲などの分類
 */
export const WorkPartType = z.enum([
  'movement', // 楽章 (交響曲、ソナタなど)
  'number', // 番号付き楽曲 (練習曲集、前奏曲集など)
  'act', // 幕 (オペラ、バレエなど)
  'scene', // 場 (オペラ、劇音楽など)
  'variation', // 変奏 (変奏曲)
  'section', // セクション (単一楽章の区切り)
  'part', // 部 (大規模作品の区切り)
  'interlude', // 間奏曲
  'supplement', // 付録/補遺
]);

/**
 * Work Part Metadata Base
 */
export const WorkPartMetadataBaseSchema = z.object({
  /** タイトル構成要素 (title, prefix, content, nickname) */
  titleComponents: TitleComponentsSchema,
  /** カタログ情報リスト (楽章個別の番号がある場合) */
  catalogues: z.array(CatalogueSchema).default([]),
  /** 補足説明 */
  description: DescriptionSchema.optional(),

  /**
   * パーツの種類
   * movement: 第1楽章
   * number: No.1
   * act: 第1幕
   * scene: 第2場
   * variation: 第1変奏
   * etc.
   */
  type: WorkPartType,

  /**
   * 名称が標準的かどうか
   * true: 「第1楽章」などの標準的な名称を自動生成して表示
   * false: titleフィールドの固有名称を優先表示 (例: 「革命」)
   */
  isNameStandard: z.boolean().default(true),

  /** 演奏難易度 (Taxonomy準拠 1-5) */
  performanceDifficulty: PerformanceDifficultySchema.optional(),

  /** 音楽的アイデンティティ */
  musicalIdentity: MusicalIdentitySchema.optional(),

  /** 感性・印象評価の6軸データ */
  impressionDimensions: ImpressionDimensionsSchema.optional(),

  /** 検索用別名リスト */
  nicknames: NicknamesSchema.default([]),
  /** 編曲・派生元情報 (楽章単位で異なる場合) */
  basedOn: z
    .object({
      /** 原曲の Slug (Work/WorkPart) */
      originalWorkSlug: SlugSchema,
      /** 編曲・派生タイプ */
      arrangeType: ArrangeTypeSchema,
      /** 編曲者 (Slug) */
      arranger: SlugSchema.optional(),
    })
    .optional(),
});

/**
 * Work Part Metadata (Refined)
 */
export const WorkPartMetadataSchema = WorkPartMetadataBaseSchema.superRefine((data, ctx) => {
  // isPrimary: true が複数存在しないことを確認
  const primaryCount = data.catalogues.filter((c) => c.isPrimary).length;
  if (primaryCount > 1) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Primary catalogue must be at most one.',
      path: ['catalogues'],
    });
  }
});

export type WorkPartMetadata = z.infer<typeof WorkPartMetadataSchema>;
