import { BaseAgent } from '@/core/agent.js';
import { GeminiModelName } from '@/core/models.js';
import { ComposerDraftSchema, type ComposerDraft } from '@/schemas/composer.js';

const SYSTEM_INSTRUCTION = `あなたは世界最高のクラシック音楽サイトの専属プロデューサー・音楽学者です。
指定された作曲家に関する正確な史実と、音楽史における独自の解釈・評価を提供してください。

# 推論プロセス（Chain of Thought）
最終的なJSONデータを出力する前に、必ず \`_reasoning\` フィールドを使用して以下の分析を行ってください。
1. nameAnalysis: 原語と日本語のカタカナ表記（フルネーム、表示名、短縮名）の整理。
2. chronologyAndLocations: 生没年と主要拠点（最大3つ）の事実確認、および現在の国コード(ISO 3166-1 alpha-2)の特定。
3. musicalContributions: 歴史的に最も貢献したジャンル・楽器と、指定Enumリストとのマッピング検証。
4. historicalContext: その作曲家の歴史的背景、最大の功績の事実ベースでの分析。
5. eraClassification: なぜその時代区分（era）を選択したのかの根拠。
6. biographyStructure: 「生い立ち」「功績」「影響」の3段落構成での伝記アウトライン作成。

# JSON出力の型制約（厳守）
必ずJSON形式で出力し、以下の型制約を正確に守ること:
- impressionDimensions の各フィールド: -10から10の間の**整数（integer）**。例: -5, 0, 8。**"low", "medium", "high" などの文字列や、"7.5" などの小数は絶対に使用禁止。**
  **注意: impressionDimensions を出力する場合は、6つの項目 (innovation, emotionality, nationalism, scale, complexity, theatricality) をすべて必ず出力してください。省略は禁止です。**
- places[].type: "birth", "death", "activity", "other" の4値のみ。
- _generatorMeta.confidenceScore: 0.0 から 1.0 の間の数値（例: 0.95）。
- birthDate, deathDate: **"YYYY-MM-DD" 形式の文字列（例: "1797-01-31"）。タイムゾーン情報（T00:00...）は絶対に含めないこと。** 日付が不明な場合は null またはフィールド自体を省略。
- 各種スラグ (slug): 指定された既存のタクソノミー（ジャンル、場所等）に合致する小文字ケバブケースを使用すること。
- 日本語の文章（特にbiography）は、必ず「です・ます調（敬語）」で統一すること。文章は3つの段落で構成し、段落間は \`\\n\\n\` で区切ること。`;

export class ComposerDraftAgent {
  private agent: BaseAgent;

  constructor(config: { modelName: GeminiModelName }) {
    this.agent = new BaseAgent({
      modelName: config.modelName,
      systemInstruction: SYSTEM_INSTRUCTION,
    });
  }

  /**
   * 作曲家の初期ドラフトデータを生成します。
   */
  async execute(composerName: string, slug: string): Promise<ComposerDraft> {
    const prompt = `作曲家 ${composerName} (スラッグ: ${slug}) のマスターデータを生成してください。

# 出力形式の注意
- **_reasoning**: 音楽史的事実の整理と時代区分の根拠を記述してください。
- **biography**: 「です・ます調（敬語）」で統一し、3段落構成（生い立ち、功績、影響）にしてください。
- **fullName, displayName, shortName, biography**: 日本語の文字列として直接出力してください。
- **birthDate, deathDate**: "YYYY-MM-DD" 形式の文字列。タイムゾーンは禁止。

# 重要な制約・ヒント (Taxonomy)
1. **era (時代)**: medieval, renaissance, baroque, classical, early-romantic, mid-romantic, late-romantic, impressionism, modern, contemporary から選択。
2. **representativeGenres**: リストから最大5つ選択: [symphony, overture, tone-poem, opera, operetta, ballet, piano-concerto, violin-concerto, concerto-grosso, chamber-strings, sonata-duo, keyboard-solo, lied, song-cycle, mass-requiem, cantata, choral-others]。
   - 特に伴奏付きソナタ（ヴァイオリンソナタ等）は \`sonata-duo\`、独奏楽器のみ（ピアノソナタ等）は \`keyboard-solo\` や \`string-solo\`（無伴奏）として区別すること。
3. **impressionDimensions**: -10から10の整数。必ず6項目すべてを出力。
4. **places[].slug**: vienna, paris, london, rome, venice, milan, st-petersburg, warsaw, prague, budapest, berlin, leipzig, salzburg, bonn 等。`;

    return await this.agent.generateObject<ComposerDraft>(prompt, ComposerDraftSchema);
  }
}
