import { z } from 'zod';
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
  prefix: z
    .string()
    .optional()
    .describe(
      '体系的識別子（ジャンル名 + 番号）。例: "交響曲第5番", "ピアノ・ソナタ第14番", "12の練習曲", "第1楽章", "Act I"。',
    ),
  content: z
    .string()
    .optional()
    .describe(
      '固有タイトル、または識別子を補完する調性や速度記号。例: "春の祭典", "ハ短調", "Allegro con brio"。',
    ),
  nickname: z
    .string()
    .optional()
    .describe(
      '一般的に親しまれている愛称・通称。例: "運命", "月光", "合唱"。広く知られた通称が存在しない場合は、このフィールド自体を出力しないでください。',
    ),
  title: z
    .string()
    .describe(
      '統合済みタイトル。原則として `{prefix} {content} {nickname}` を適切な空白で結合した最終的な表示名称。',
    ),
});

/**
 * Catalogue Draft Schema
 */
export const CatalogueDraftSchema = z.object({
  prefix: MusicalCataloguePrefixSchema.optional().describe(
    'カタログの接頭辞。選択肢: op, op-posth, woo, bwv, rv, hwv, twv, z, f, k, kv, d, kk, wq, h, g, hob-i, hob-ia, hob-ii, hob-iii, hob-iv, hob-v, hob-vi, hob-vii, hob-viii, hob-ix, hob-x, hob-xi, hob-xii, hob-xiii, hob-xiv, hob-xv, hob-xva, hob-xvi, hob-xvii, hob-xviii, hob-xix, hob-xx, hob-xxi, hob-xxii, hob-xxiii, hob-xxiv, hob-xxv, hob-xxvi, hob-xxvii, hob-xxviii, hob-xxix, hob-xxx, hob-xxxi, s, l, m, sz, bb, b, anh, hess, custom。',
  ),
  number: z
    .string()
    .optional()
    .describe('番号部分。例: "67", "331a", "I:1"。枝番やローマ数字を含む。'),
  isPrimary: z
    .boolean()
    .default(true)
    .describe('true: 作品の主たる識別番号（Op.等）, false: 補助的な番号'),
});

/**
 * Musical Identity Draft Schema (Specialized for Agent)
 */
export const MusicalIdentityDraftSchema = z.object({
  key: MusicalKeySchema.optional().describe(
    '調性。選択肢: c-major, c-sharp-major, d-flat-major, d-major, e-flat-major, e-major, f-major, f-sharp-major, g-flat-major, g-major, a-flat-major, a-major, b-flat-major, b-major, c-flat-major, c-minor, c-sharp-minor, d-minor, d-sharp-minor, e-flat-minor, e-minor, f-minor, f-sharp-minor, g-minor, g-sharp-minor, a-minor, a-sharp-minor, b-flat-minor, b-minor, a-flat-minor, c, c-sharp, d-flat, d, d-sharp, e-flat, e, f, f-sharp, g-flat, g, g-sharp, a-flat, a, a-sharp, b-flat, b, c-flat, atonal。',
  ),
  tempo: z
    .string()
    .optional()
    .describe(
      'テンポ・速度記号（原語）。詳細な速度指定や表情付けを含めて記述してください。例: "Allegro", "Andante cantabile", "Adagio non troppo", "Allegro con brio", "Molto vivace"。',
    ),
  timeSignature: z
    .object({
      numerator: z.number().int().min(1).max(64),
      denominator: z.number().int().min(1).max(64),
    })
    .optional()
    .describe('拍子 (e.g. 4/4)'),
  genres: z
    .array(MusicalGenreSchema)
    .max(5)
    .describe(
      'ジャンル・形式（最大5つ）。選択肢: symphony, overture, tone-poem, suite-orch, serenade-divertimento, incidental-music, opera, operetta, ballet, piano-concerto, violin-concerto, cello-concerto, wind-concerto, concerto-grosso, concerted-work, chamber-strings, chamber-piano, sonata-duo, keyboard-ensemble, chamber-wind, chamber-mixed, keyboard-solo, string-solo, wind-solo, solo-other-inst, lied, song-cycle, mass-requiem, oratorio-passion, cantata, early-vocal, choral-others, sonata, sonata-form, variations, fugue-counterpoint, suite-partita, rondo, ternary-form, binary-form, cyclic-form, aria, recitative, vocal-ensemble, chorus-piece, mass-ordinary, requiem-form, passion-structure, chorale, motet, madrigal, lied-song, song-cycle-structure, strophic, through-composed, vocalise, prelude, nocturne, impromptu, scherzo, ballade, fantasia, intermezzo, bagatelle, humoresque, romance, arabesque, barcarolle-berceuse, elegy, etude, toccata, caprice-capriccio, rhapsody, transcription-paraphrase, concert-piece, cadenza, style-brillant, allemande, courante, sarabande, gigue, gavotte, bourree, passepied, minuet, waltz, polonaise, mazurka, march, tarantella, bolero-habanera, czardas, polka, galop, pavane-galliard, passacaglia, chaconne, basso-ostinato, folia, symphonic-poem-structure, program-symphony-form, leitmotif-system, idee-fixe, melodrame, word-painting。',
    ),
  bpm: z
    .number()
    .int()
    .min(10)
    .max(500)
    .optional()
    .describe(
      'メトロノーム記号（BPM数値）。作曲者によって楽譜等で具体的に指定されている場合のみ出力し、そうでない場合は項目自体を出力しないでください。',
    ),
  metronomeUnit: MetronomeUnitSchema.optional().describe(
    'BPMの基準点。BPMと同様に指定がある場合のみ出力してください。選択肢: whole, half, quarter, eighth, sixteenth, dotted-half, dotted-quarter, dotted-eighth, dotted-sixteenth。',
  ),
  tempoTranslation: z.string().optional().describe('テンポ指定や速度記号の日本語訳。'),
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
  era: '時代区分。',
  compositionYear: '数値による作曲年。ソートに使用。',
  compositionPeriod: '「1805年頃」などのローカライズされた作曲時期。',
  instrumentation: '楽器編成のテキスト。例: "2.2.2.2 - 4.2.3.0 - tmp - str"。',
  tags: '検索・分類用の自由タグ（最大10個まで）。「情緒」「利用シーン」「音楽用語」など異なるカテゴリから、楽曲の特徴を多角的に表すタグを選択してください。',
  nicknames:
    '検索用の別名・愛称のリスト（JSONの文字列配列）。広く知られた通称が存在しない場合は空配列 `[]` を出力してください。',
  performanceDifficulty: '演奏難易度（1-5）。',
  instruments: '使用楽器のIDリスト。',
};
