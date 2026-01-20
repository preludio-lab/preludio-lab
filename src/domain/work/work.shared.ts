import { z, zInt } from '@/shared/validation/zod';
import { createMultilingualStringSchema } from '../i18n/locale';
import { MusicalCataloguePrefixSchema } from './musical-catalogue-prefix';
import { MusicalGenreSchema } from '../shared/musical-genre';
import { MusicalKeySchema } from './musical-key';
import { DimensionSchema } from '../shared/common.metadata';

/**
 * 共有の音楽メタデータスキーマ定義 (WorkShared)
 * Work (作品) と WorkPart (楽章) の両方で使用される Value Objects や共通の制約を定義します。
 */

// --- Multilingual Strings (Common Constraints) ---
export const TitleSchema = createMultilingualStringSchema({ max: 150 });
export const DescriptionSchema = createMultilingualStringSchema({ max: 2000 });
export const TempoTranslationSchema = createMultilingualStringSchema({ max: 100 });
export const CompositionPeriodSchema = createMultilingualStringSchema({ max: 50 });

/**
 * Title Components
 * 称号、本題、ニックネームを分離して管理するための構造
 */
export const TitleComponentsSchema = z.object({
  /**
   * 統合済みタイトル (Consolidated Title)
   * 規則: {prefix} {content} {nickname}
   */
  title: TitleSchema,
  /**
   * 接頭辞 (Systematic Identifier)
   * 楽曲を体系的に分類・識別するための「ジャンル名 + 番号」。
   * 例: "第1楽章", "交響曲第5番", "No. 1"
   */
  prefix: TitleSchema.optional(),
  /**
   * 内容 (Substantive Title)
   * 楽曲の固有性を決定づける情報。
   * - 固有曲: 作曲家が付与した「固有タイトル」 (例: "くるみ割り人形", "La Mer")
   * - 汎用曲 (固有タイトルなし): 識別子を補完する「テンポ」や「調性」 (例: "ハ短調", "in C minor")
   */
  content: TitleSchema.optional(),
  /**
   * 通称 (Colloquial Name)
   * 一般大衆や後世によって付けられた呼び名。
   * 例: "運命", "Moonlight"
   */
  nickname: TitleSchema.optional(),
});

export type TitleComponents = z.infer<typeof TitleComponentsSchema>;

/** 演奏難易度 (Taxonomy準拠 1-5) */
export const PerformanceDifficultySchema = zInt().min(1).max(5);

/** 検索用別名リスト */
export const NicknamesSchema = z.array(z.string().max(100)).max(20);

/**
 * Impression Dimensions
 * 6軸の印象評価値 (-10 to +10 の整数)
 */
export const ImpressionDimensionsSchema = z.object({
  /** 明るさ (Brightness) */
  brightness: DimensionSchema,
  /** 躍動感 (Vibrancy) */
  vibrancy: DimensionSchema,
  /** 規模感 (Scale) */
  scale: DimensionSchema,
  /** 深み (Depth) */
  depth: DimensionSchema,
  /** ドラマ性 (Drama) */
  drama: DimensionSchema,
  /** 通俗性・人気度 (Popularity) */
  popularity: DimensionSchema,
});

export type ImpressionDimensions = z.infer<typeof ImpressionDimensionsSchema>;

// --- Musical Properties ---

/** 調性 (e.g. "c-major", "atonal", "f") */
export const KeySchema = MusicalKeySchema;

/** テンポ表示 (e.g. "Allegro con brio", "Quarter note = 120") */
export const TempoSchema = z.string().max(50);

/**
 * 拍子 (Structured)
 * 4/4 拍子の場合: { numerator: 4, denominator: 4 }
 */
export const TimeSignatureSchema = z.object({
  /** 分子 (Number of beats) */
  numerator: zInt().min(1).max(64),
  /** 分分母 (Beat unit) */
  denominator: zInt().min(1).max(64),
  /** 特殊表記や伝統的表記 (e.g. "C", "Alla Breve") */
  displayString: z.string().max(20).optional(),
});

/**
 * メトロノーム単位
 * ♩=120 の「♩」を定義
 */
export const MetronomeUnit = {
  WHOLE: 'whole', // 全音符
  HALF: 'half', // 2分音符
  QUARTER: 'quarter', // 4分音符 (Standard)
  EIGHTH: 'eighth', // 8分音符
  SIXTEENTH: 'sixteenth', // 16分音符
  DOTTED_HALF: 'dotted-half', // 付点2分音符
  DOTTED_QUARTER: 'dotted-quarter', // 付点4分音符
  DOTTED_EIGHTH: 'dotted-eighth', // 付点8分音符
  DOTTED_SIXTEENTH: 'dotted-sixteenth', // 付点16分音符
} as const;

export type MetronomeUnit = (typeof MetronomeUnit)[keyof typeof MetronomeUnit];

// Zodのz.enumに「空でない配列（タプル）」を渡すための型キャスト
export const MetronomeUnitSchema = z.enum(
  Object.values(MetronomeUnit) as [MetronomeUnit, ...MetronomeUnit[]],
);

/**
 * 作品番号・カタログ情報
 */
export const CatalogueSchema = z.object({
  /** 接頭辞 (e.g. "op", "bwv", "hob-i") */
  prefix: MusicalCataloguePrefixSchema.optional(),
  /**
   * 番号部分 (e.g. "67", "331a", "I:1")
   * 数値だけでなく、枝番やローマ数字を含む複雑な表記を許容。
   */
  number: z.string().max(20).optional(),
  /**
   * ソート用の数値 (カタログ順に並べるために使用、1-1,000,000)
   */
  sortOrder: z.number().min(0).max(1_000_000).optional(),
});

/**
 * Musical Identity
 * 楽曲の音楽的な特徴をまとめた値オブジェクト
 */
export const MusicalIdentitySchema = z.object({
  /** 調性 (e.g. "c-major") */
  key: KeySchema.optional(),
  /** テンポ (原語表記 e.g. "Allegro") */
  tempo: TempoSchema.optional(),
  /** テンポ（多言語訳・補足） */
  tempoTranslation: TempoTranslationSchema.optional(),
  /** 拍子 */
  timeSignature: TimeSignatureSchema.optional(),
  /**
   * ジャンル・形式リスト (MusicalGenre 準拠) (最大20要素まで)
   */
  genres: z.array(MusicalGenreSchema).max(20).default([]),
  /** メトロノーム記号 (BPM数値) */
  bpm: zInt().min(10).max(500).optional(),
  /** メトロノーム単位 (e.g. "quarter") */
  metronomeUnit: MetronomeUnitSchema.optional(),
});

export type MusicalIdentity = z.infer<typeof MusicalIdentitySchema>;
