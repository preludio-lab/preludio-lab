import { z, zInt } from '@/shared/validation/zod';
import { createMultilingualStringSchema, MultilingualStringSchema } from '../i18n/Locale';
import { SlugSchema } from '../shared/Slug';
import { MusicalEraSchema } from '../shared/MusicalEra';

/**
 * Musical Property Schemas (Value Objects)
 * 作品全体と個別の楽章（Part）の両方で共有される項目を定義。
 */

/** 調性 (e.g. "c-major", "a-minor") */
export const KeySchema = z.string().max(20);

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
 * 作品番号・カタログ情報
 */
export const CatalogueSchema = z.object({
  /** 接頭辞 (e.g. "Op.", "BWV", "K.") */
  prefix: z.string().max(10).optional(),
  /** 
   * 番号部分 (e.g. "67", "331a", "I:1")
   * 数値だけでなく、枝番やローマ数字を含む複雑な表記を許容。
   */
  number: z.string().max(20).optional(),
  /** 
   * ソート用の数値 (カタログ順に並べるために使用、1-1,000,000)
   * 
   * 【設計指針】
   * 1. 重複は許容。重複した場合は `number` (文字列) の昇順でタイブレーク。
   *    (例: 331 と 331a がある場合、両方に 331 を設定すると 331 -> 331a の順になる)
   * 2. ハイドン (Hob. I:1) 等のカテゴリ付きの場合は、上位桁をカテゴリ管理に使用することを推奨。
   *    (例: Hob. I:1 -> 1001, Hob. III:1 -> 3001)
   */
  sortOrder: zInt().min(1).max(1_000_000).optional(),
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
  Object.values(MetronomeUnit) as [MetronomeUnit, ...MetronomeUnit[]]
);

/** 多言語文字列の制約定義 */
const TitleSchema = createMultilingualStringSchema({ max: 150 });
const DescriptionSchema = createMultilingualStringSchema({ max: 2000 }); // 解説も長文化を想定
const TempoTranslationSchema = createMultilingualStringSchema({ max: 100 });
const CompositionPeriodSchema = createMultilingualStringSchema({ max: 50 });

/**
 * 楽器編成フラグ (検索・フィルタリング用)
 */
export const InstrumentationFlagsSchema = z.object({
  /** 独奏曲か */
  isSolo: z.boolean().default(false),
  /** 室内楽か */
  isChamber: z.boolean().default(false),
  /** 管弦楽曲か */
  isOrchestral: z.boolean().default(false),
  /** 合唱を伴うか */
  hasChorus: z.boolean().default(false),
  /** 声楽を伴うか (独唱等) */
  hasVocal: z.boolean().default(false),
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
   * ジャンル・形式リスト (TaxonomyのIDを保持) 
   * 作品全体を代表するジャンル（交響曲等）に加え、
   * 楽章単位での形式（ソナタ形式、変奏曲等）を表現するために使用。
   */
  genres: z.array(z.string().max(32)).default([]),
  /** メトロノーム記号 (BPM数値) */
  bpm: zInt().min(10).max(500).optional(),
  /** メトロノーム単位 (e.g. "quarter") */
  metronomeUnit: MetronomeUnitSchema.optional(),
});

export type MusicalIdentity = z.infer<typeof MusicalIdentitySchema>;

/**
 * Work Part
 * 楽章や組曲の一部などを表す構造
 */
export const WorkPartSchema = z.object({
  /** 
   * パーツID (UUID)
   * MDX等の手動管理を容易にするため、入力時は任意。
   * システムでの生成またはDB保存時に付加されることを想定。
   */
  id: z.string().uuid().optional(),
  /** URLスラグ (作品内で一意) e.g. "1st-mov" */
  slug: SlugSchema,
  /** 表示順 (1st, 2nd, ...) */
  order: zInt().min(1),
  /** 楽章名・パーツタイトル */
  title: TitleSchema,
  /** 補足説明 */
  description: DescriptionSchema.optional(),

  /** 音楽的アイデンティティ */
  musicalIdentity: MusicalIdentitySchema.optional(),
});

export type WorkPart = z.infer<typeof WorkPartSchema>;

/**
 * Work Metadata
 * 作品のメタデータ (多言語対応)
 */
export const WorkMetadataSchema = z.object({
  /** 正式名称 */
  title: TitleSchema,
  /** 通称 (e.g. "運命") */
  popularTitle: TitleSchema.optional(),

  /** カタログ情報 (作品番号等) */
  catalogue: CatalogueSchema.optional(),

  /** 作曲家 ID/Slug */
  composer: z.string().max(64).optional(),
  /** 時代区分 (Taxonomy準拠) */
  era: MusicalEraSchema.optional(),

  /** 
   * 楽器編成 (テキスト記述 e.g. "Piano solo", "2.2.2.2 - 4.2.3.1 - tmp - str") 
   * 編成は原則として作品全体で固定されるため、トップレベルで管理。
   */
  instrumentation: z.string().max(200).optional(),
  /** 楽器編成フラグ (フィルタリング用) */
  instrumentationFlags: InstrumentationFlagsSchema.default({
    isSolo: false,
    isChamber: false,
    isOrchestral: false,
    hasChorus: false,
    hasVocal: false,
  }),

  /** 演奏難易度 (Taxonomy準拠 1-5) */
  performanceDifficulty: zInt().min(1).max(5).optional(),

  /** 音楽的アイデンティティ (代表的な値) */
  musicalIdentity: MusicalIdentitySchema.optional(),

  /** 作曲年 (ソート用) */
  compositionYear: zInt().min(1000).max(2999).optional(),
  /** 作曲時期 (e.g. "1805年頃") */
  compositionPeriod: CompositionPeriodSchema.optional(),
  /** 検索用別名リスト */
  nicknames: z.array(z.string().max(100)).max(20).default([]),
  /** 作品解説 */
  description: DescriptionSchema.optional(),
  /** 自由タグ */
  tags: z.array(z.string().max(50)).max(100).default([]),
  /** 構成楽曲・楽章リスト (最大100要素まで) */
  parts: z.array(WorkPartSchema).max(100).default([]),
});

export type WorkMetadata = z.infer<typeof WorkMetadataSchema>;
