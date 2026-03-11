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
6. summaryStructure: 「①人物の立ち位置（誰か）」「②音楽の特徴と、初心者が聴きたくなる魅力（親しみやすさ）」の2軸で構成するサマリーのアウトライン作成。
7. tagSelection: 指定されたタグリスト（composer-attribute, musical-schools）の中から、その作曲家の生涯や作風を最も象徴するタグ（最大5つ）を選定し、なぜそれが妥当であるかの根拠を提示。

# JSON出力の型制約（厳守）
必ずJSON形式で出力し、以下の型制約を正確に守ること:
- impressionDimensions: 作曲家の作風・特徴を表す6軸の印象評価値です。必ず以下の定義に従い、-10から+10の整数で6項目すべてを出力してください（0は中立・バランス型を意味します）。小数の使用は厳禁です。
  * innovation: 伝統的(-10) <-> 中立(0) <-> 革新的(+10)
  * emotionality: 知的・構造的(-10) <-> 中立(0) <-> 感情的・情動的(+10)
  * nationalism: 国際的・普遍的(-10) <-> 中立(0) <-> 民族的(+10)
  * scale: 親密・室内楽的(-10) <-> 中立(0) <-> 壮大・大編成(+10)
  * complexity: 簡潔・明快(-10) <-> 中立(0) <-> 複雑・難解(+10)
  * theatricality: 絶対音楽(-10) <-> 中立(0) <-> 演劇的・標題音楽的(+10)
  【評価の基準（Few-Shot例）】
  各極端な値の基準として以下を参考にし、対象の作曲家を相対的にマッピングしてください。
  - J.S.バッハの例: emotionalityは -8 (極めて知的・対位法的)、theatricalityは -9 (絶対音楽の最高峰)
  - ワーグナーの例: scaleは 10 (極めて壮大)、theatricalityは 10 (総合芸術・演劇的)
  - ショパンの例: scaleは -7 (ピアノ独奏中心で親密)、emotionalityは 8 (感情豊か)
  - モーツァルトの例: complexityは -3 (明快で自然)、innovationは 0 (伝統の完成・中立)
- places[].type: "birth", "death", "activity", "other" の4値のみ。
- _generatorMeta.confidenceScore: 0.0 から 1.0 の間の数値（例: 0.95）。
- 肖像画 (portrait): 必ず \`/composers/{slug}/images/portrait.webp\` の形式で出力すること。{slug}は実際の作曲家のスラグに置き換える。
- summary: 作曲家一覧画面のカードやSEOメタデータとして使用する、80〜120字程度の短い紹介文。「です・ます調」で統一すること。
  【重要】音楽学者としての難解な解説（専門用語や過剰な美辞麗句）は避け、クラシック初心者でも親しみを感じるキャッチーな文章にすること。「①その作曲家の音楽史における立ち位置や異名」と、「②その人の音楽が持つ最大の魅力（どんな気持ちの時に聴きたくなるか）」の2文程度で端的にまとめること。
  （例: 「『ピアノの詩人』と称され、ピアノの表現力を極限まで高めたポーランドの作曲家です。夜の静寂を思わせる美しくも切ないメロディは、心を落ち着かせたい時に優しく寄り添ってくれます。」）
- representativeInstruments: 作曲家自身が名手であった、または独奏曲として歴史的に重要視した楽器に限定し、最大5つまでとする。交響曲の管弦楽編成を無闇に羅列しないこと。
- _generatorMeta.sourceRefs: 架空の個別記事URL（ディープリンク）の生成を厳禁とし、事実確認に用いた権威ある辞書・研究機関・アーカイブのトップレベルドメインのみを配列で出力すること。（例: "https://www.oxfordmusiconline.com", "https://www.britannica.com", "https://imslp.org", "https://www.beethoven.de" 等。Wikipediaは含めないこと）
- birthDate, deathDate: **"YYYY-MM-DD" 形式の文字列（例: "1797-01-31"）。タイムゾーン情報（T00:00...）は絶対に含めないこと。** 生年月日が正確に不明で「洗礼日」のみが判明している場合は、便宜上その洗礼日を birthDate に設定すること。日付が完全に不明な場合は null またはフィールド自体を省略。
- 各種スラグ (slug): 指定された既存のタクソノミー（ジャンル、場所等）に合致する小文字ケバブケースを使用すること。`;

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
- **fullName, displayName, shortName, summary**: 日本語の文字列として直接出力してください。

# 重要な制約・ヒント (Taxonomy)
1. **era (時代)**: medieval, renaissance, baroque, classical, early-romantic, mid-romantic, late-romantic, impressionism, modern, contemporary から選択。
2. **representativeGenres**: リストから最大5つ選択: [symphony, overture, tone-poem, opera, operetta, ballet, piano-concerto, violin-concerto, concerto-grosso, chamber-strings, sonata-duo, keyboard-solo, lied, song-cycle, mass-requiem, cantata, choral-others]。
   - 特に伴奏付きソナタ（ヴァイオリンソナタ等）は \`sonata-duo\`、独奏楽器のみ（ピアノソナタ等）は \`keyboard-solo\` や \`string-solo\`（無伴奏）として区別すること。
3. **impressionDimensions**: -10から10の整数。必ず6項目すべてを出力。
4. **places[].slug**: vienna, paris, london, rome, venice, milan, st-petersburg, warsaw, prague, budapest, berlin, leipzig, salzburg, bonn 等。
5. **tags**: 以下のリストから、作曲家を最も象徴するタグを最大5つまで選択してください。
   - [composer-attribute]: virtuoso-composer, contrapuntist, master-orchestrator, melodist, stage-music-specialist, miniaturist, conservative-classicist, progressive-innovator, folk-music-explorer, prolific-composer, late-bloomer, polymath, child-prodigy, short-lived-genius, devout-composer, tragic-life, nationalist-figure
   - [musical-schools]: viennese-classicism, second-viennese-school, franco-belgian-school, mighty-handful, les-six`;

    return await this.agent.generateObject<ComposerDraft>(prompt, ComposerDraftSchema);
  }
}
