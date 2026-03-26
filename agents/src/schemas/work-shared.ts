import { z } from 'zod';
import { consola } from 'consola';
import { ArrangeTypeSchema, MetronomeUnitSchema } from '@/domain/work/work.shared.js';
import { MusicalCataloguePrefixSchema } from '@/domain/work/musical-catalogue-prefix.js';
import { MusicalKeySchema } from '@/domain/work/musical-key.js';
import { MusicalGenreSchema } from '@/domain/shared/musical-genre.js';
import { MusicalEra } from '@/domain/shared/musical-era.js';
import { MusicalInstrument } from '@/domain/shared/musical-instrument.js';
import { MusicalTag } from '@/domain/shared/musical-tag.js';

/**
 * AIエージェントに向けた共通のスキーマ定義
 * Work (作品) と WorkPart (楽章) の両方で共有される AI 指示文 (.describe) を集約します。
 */

/** 多言語対応ドラフト用の基本構造 (Gemini Flash Lite への強制 & 自動成形) */
export const MultilingualDraftSchema = z.preprocess(
  (val) => {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      // Handle stringified JSON hallucination: { "ja": "..." }
      if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (parsed && typeof parsed === 'object' && 'ja' in parsed) {
            return parsed;
          }
        } catch (_e) {
          // Fallback to wrapping if not valid JSON
        }
      }

      consola.warn(
        `[Schema Recovery] LLM output a flat string instead of an object. Wrapping into { ja: ... }: "${val.slice(0, 30)}${val.length > 30 ? '...' : ''}"`,
      );
      return { ja: val };
    }
    return val;
  },
  z.object({
    ja: z
      .string()
      .min(1)
      .describe(
        '【重要】必ず {"ja": "値"} というオブジェクト形式で出力してください。文字列を直接出力するとエラーになります。',
      ),
  }),
);

/** Era Enum for strict constraints */
const ERAS = Object.values(MusicalEra) as [string, ...string[]];
export const EraDraftSchema = z.enum(ERAS);

/** Instrument ID Enum for strict constraints */
const INSTRUMENTS = Object.values(MusicalInstrument) as [string, ...string[]];
export const InstrumentIdDraftSchema = z.enum(INSTRUMENTS);

/** Tag ID Enum for strict constraints */
const TAGS = Object.values(MusicalTag) as [string, ...string[]];
export const TagIdDraftSchema = z.enum(TAGS);

/**
 * Title Components Draft Schema
 */
export const TitleComponentsDraftSchema = z.object({
  prefix: MultilingualDraftSchema.optional().describe(
    '体系的識別子（ジャンル名 + 番号）。例: {"ja": "交響曲第5番"}, {"ja": "第1楽章"}。',
  ),
  content: MultilingualDraftSchema.optional().describe(
    '固有タイトル、または識別子を補完する調性や速度記号。例: {"ja": "春の祭典"}, {"ja": "ハ短調"}。',
  ),
  nickname: MultilingualDraftSchema.nullable()
    .optional()
    .describe(
      '一般的に親しまれている愛称・通称。例: {"ja": "運命"}, {"ja": "月光"}。「ニ短調」のような調性や、「弦楽四重奏曲」のような形式名をここに入力してはいけません。広く知られた固有の愛称が存在しない場合は、必ず null を出力してください。',
    ),
});

/**
 * Catalogue Draft Schema
 */
export const CatalogueDraftSchema = z.object({
  prefix: MusicalCataloguePrefixSchema.optional().describe(
    'カタログの接頭辞。選択肢: op, op-posth, woo, bwv, rv, hwv, twv, z, f, k, kv, d, kk, wq, h, g, hob-i, ...（注: 同様の目録で複数の表記がある場合（例: k と kv）、プロジェクト標準の短い表記（例: k）を優先してください）。値がない場合はこのフィールド自体を出力しないでください。',
  ),
  number: z
    .string()
    .optional()
    .describe(
      '番号部分。例: "67", "331a", "I:1"。枝番やローマ数字を含む。値がない場合はこのフィールド自体を出力しないでください。',
    ),
  isPrimary: z
    .boolean()
    .default(true)
    .describe('true: 作品の主たる識別番号（Op.等）, false: 補助的な番号'),
});

/**
 * Musical Identity Draft Schema (Specialized for Agent)
 */
export const MusicalIdentityDraftSchema = z.object({
  key: MusicalKeySchema.nullable()
    .optional()
    .describe(
      '調性。選択肢: c-major, c-minor 等。多楽章形式の作品（交響曲・ソナタ等）の場合、楽曲全体(Work)のメタデータとしては主調のみを記述し、各楽章(WorkPart)でそれぞれの調性を指定してください。該当しない場合は null を出力してください。',
    ),
  tempo: z
    .string()
    .nullable()
    .optional()
    .describe(
      'テンポ・速度記号（原語）。例: "Allegro", "Andante"。多楽章形式の作品の場合、楽曲全体(Work)では情報を捏造せず、必ず null を出力してください。',
    ),
  timeSignature: z
    .object({
      numerator: z.number().int().min(1).max(64),
      denominator: z.number().int().min(1).max(64),
    })
    .nullable()
    .optional()
    .describe(
      '拍子 (e.g. 4/4)。多楽章形式の作品の場合、楽曲全体(Work)では必ず null を出力してください。',
    ),
  genres: z
    .array(MusicalGenreSchema)
    .max(5)
    .describe(
      'ジャンル・形式（最大5つ）。楽曲全体のジャンルを指定します。多楽章形式の作品において、特定の楽章のみの形式（sonata-form, rondo 等）はここには含めず、各楽章のタグや形式として指定してください。',
    ),
  bpm: z
    .number()
    .int()
    .min(10)
    .max(500)
    .nullable()
    .optional()
    .describe(
      'メトロノーム記号（BPM数値）。多楽章形式の楽曲全体 (Work) や、指定がない場合は null を出力してください。',
    ),
  metronomeUnit: MetronomeUnitSchema.nullable()
    .optional()
    .describe(
      'BPMの基準点。BPMと同様に指定がある場合のみ出力し、そうでない場合は null を出力してください。',
    ),
  tempoTranslation: MultilingualDraftSchema.nullable()
    .optional()
    .describe('テンポ指定や速度記号の日本語訳。該当しない場合は null。'),
});

/**
 * Based-On Draft Schema
 */
export const BasedOnDraftSchema = z.object({
  originalWorkSlug: z.string().describe('原曲のスラグ。例: "symphony-no-9"。'),
  arrangeType: ArrangeTypeSchema.describe(
    '編曲・派生の種類。選択肢: transcription, variation, paraphrase, orchestration, reduction, reconstruction。',
  ),
  arranger: z.string().optional().describe('編曲者の名前（既知の場合のみ）。'),
});

/**
 * Impression Dimensions Draft Schema
 */
export const ImpressionDimensionsDraftSchema = z
  .object({
    innovation: z
      .number()
      .int()
      .min(-10)
      .max(10)
      .describe('革新性: 伝統的・保守的(-10) <-> 中立(0) <-> 革新的・実験的(+10)'),
    emotionality: z
      .number()
      .int()
      .min(-10)
      .max(10)
      .describe('情動性: 知的・客観的(-10) <-> 中立(0) <-> 感情的・情熱的(+10)'),
    nationalism: z
      .number()
      .int()
      .min(-10)
      .max(10)
      .describe('民族性: 国際的・普遍的(-10) <-> 中立(0) <-> 民族的・郷土的(+10)'),
    scale: z
      .number()
      .int()
      .min(-10)
      .max(10)
      .describe('規模感: 親密・室内楽的(-10) <-> 中立(0) <-> 壮大・宇宙的(+10)'),
    complexity: z
      .number()
      .int()
      .min(-10)
      .max(10)
      .describe('複雑性: 簡潔・明快(-10) <-> 中立(0) <-> 複雑・深遠(+10)'),
    theatricality: z
      .number()
      .int()
      .min(-10)
      .max(10)
      .describe('演劇性: 絶対音楽的(-10) <-> 中立(0) <-> 劇的・標題的(+10)'),
  })
  .describe(
    '感性・印象評価の6軸データ。-10から10の整数で指定（0は中立・バランス型）。小数は使用禁止。',
  );

/**
 * Instrumentation Flags Draft Schema
 */
export const InstrumentationFlagsDraftSchema = z
  .object({
    isSolo: z.boolean().describe('true: 独奏曲である、false: 独奏曲でない'),
    isChamber: z.boolean().describe('true: 室内楽である、false: 室内楽でない'),
    isOrchestral: z.boolean().describe('true: 管弦楽曲である、false: 管弦楽曲でない'),
    hasChorus: z.boolean().describe('true: 合唱を伴う、false: 合唱を伴わない'),
    hasVocal: z.boolean().describe('true: 声楽を伴う、false: 声楽を伴わない'),
  })
  .describe('編成の特徴フラグ');

/**
 * Common Metadata Descriptions
 */
export const CommonDescriptions = {
  era: '時代区分。作曲年に基づいて厳格に判定してください（例: classical=1730-1820, early-romantic=1815-1850, mid-romantic=1850-1890等）。ショパンやメンデルスゾーン等は early-romantic に分類されます。',
  compositionYear: '数値による作曲年。ソートに使用。',
  compositionPeriod: '「1805年頃」などの作曲時期テキスト。{"ja": "1805年頃"} 形式で出力。',
  instrumentation: '楽器編成のテキスト。例: "2.2.2.2 - 4.2.3.0 - tmp - str"。',
  tags: '検索・分類用の自由タグ（最大10個まで）。「情緒(mood)」「利用シーン(situation)」「音楽用語(terminology)」「文化的文脈(heritage)」など異なるカテゴリから、楽曲の特徴を多角的に表すタグを選択してください。【重要】ジャンル・形式のID（polonaise, waltz, nocturne等）は genres フィールドに出力してください。tags にジャンル名を含めるとバリデーションエラーになります。',
  nicknames:
    '検索用の別名・愛称のリスト（JSONの文字列配列）。広く知られた通称が存在しない場合は、空配列を出力するのではなく、フィールド自体を省略してください。',
  performanceDifficulty: '演奏難易度（1-5）。',
  instruments: '使用楽器のIDリスト。',
};
