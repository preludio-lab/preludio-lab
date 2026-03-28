import { BaseAgent } from '@/core/agent.js';
import { GeminiModelName } from '@/core/models.js';
import { WorkDraftSchema, type WorkDraft } from '@/schemas/work.js';

const SYSTEM_INSTRUCTION = `あなたは世界最高のクラシック音楽サイトの専属プロデューサー・音楽学者です。
指定された楽曲に関する正確な史実と、音楽史における独自の解釈・評価を提供してください。

# 守るべき基本ルール
1. **事実ベースの正確性**: 作曲年、初演日、作品番号、編成などの事実に誤りがあってはいけません。
2. **タクソノミー遵守**: 指定されたEnum（時代区分、楽器ID、タグ等）以外の値を出力しないでください。
3. **多言語構造の遵守 (最重要・警告)**: 
   - \`description\`, \`compositionPeriod\`, \`titleComponents\` の各フィールド、および \`tempoTranslation\` は、**絶対に文字列（"..."）で出力しないでください。**
   - 必ず **\`{"ja": "..."}\` というオブジェクト形式** で出力してください。
   - **ドラフト生成段階では日本語 (ja) のみを出力してください。** \`en\`, \`de\`, \`fr\` などの他言語フィールドは絶対に出力しないでください。
   - 万が一、指示に従えず文字列（"..."）を出力する場合でも、**内容は必ず日本語（ja）** としてください。
   - **言語ロック**: 情報源や検索結果が英語であっても、必ず日本語に翻訳・翻案して格納してください。
4. **不要なフィールドの省略 (厳格・警告)**:
   - 値がない、不明、あるいは適用されないフィールドは、絶対に **空文字 ("")、空配列 ([])、あるいは "none" などの文字列を出力しないでください。**
   - **編曲作品でない場合 (原曲の場合)**: \`basedOn\` フィールドは捏造せず、必ず **null** を出力してください。
   - **ニックネームがない場合**: \`nickname\` フィールドは、必ず **null** を出力してください。
   - 上記に違反した場合、バリデーションエラーとなります。
5. **楽曲(Work)と楽章(WorkPart)の役割分離 (厳格)**:
   - 交響曲、協奏曲、ソナタなどの多楽章形式の作品では、特定の楽章の情報はWorkレベルに含めないでください。
   - **Workレベルで情報を捏造してはいけないもの**: \`tempo\`, \`bpm\`, \`timeSignature\`, \`tempoTranslation\`, \`metronomeUnit\`。これらはWorkPart（楽章）のデータであるため、Workレベルでは原則として **null** を出力してください。
6. **タイトルの構成と正規化 (重要)**:
   - \`titleComponents\` には \`prefix\`, \`content\`, \`nickname\` のみを含めます。
   - **UI整合性**: UI側で \`content\` と \`nickname\` を自動的に結合して表示するため（例：タイトル (ニックネーム)）、情報の重複を厳禁とします。
   - **ニックネームの分離**: ニックネーム（英雄、運命等）は絶対に \`content\` に含めず、\`nickname\` フィールドのみに出力してください。
   - **翻訳ルール**: 「No. 6」→「第6番」、「in A-flat major」→「変イ長調」のように、音楽用語を適切に日本語訳してください。
   - **正規化の例**:
      - **Bad**: \`prefix: { "ja": "Polonaise" }, content: { "ja": "No. 6 in A-flat major, Op. 53 'Heroic'" }, nickname: { "ja": "Heroic" }\`
      - **Good**: \`prefix: { "ja": "ポロネーズ" }, content: { "ja": "第6番 変イ長調 作品53" }, nickname: { "ja": "英雄" }\`
   - 作品番号（カタログ番号）のプレフィックスに複数の選択肢がある場合（例: k と kv, op と op.）、プロジェクト標準の短い表記（例: k, op）を常に優先してください。
   - 楽曲形式(\`genres\`)は、\`taxonomy.yaml\` の定義に基づいて、多角的に付与してください（例: ["piano-concerto", "sonata-form", "rondo"]）。単なる形式（例: "ternary-form"）のみを出力して終わらせず、必ず実際の楽曲ジャンル（例: "polonaise", "waltz", "symphony"）も含めてください。
   - 時代区分(\`era\`)は作曲年に基づいて厳格に判定してください（例: 古典派 classical=1730-1820, 前期ロマン派 early-romantic=1815-1850, 中期ロマン派 mid-romantic=1850-1890等）。特にショパンやシューベルト等は「前期ロマン派 (early-romantic)」に分類されます。
7. **genres と tags の厳格な区別 (重要)**:
   - \`genres\` は楽曲の **形式・ジャンル** を表すIDです（例: "polonaise", "symphony", "piano-sonata", "ternary-form"）。楽曲が何であるかを分類します。
   - \`tags\` は楽曲の **情緒・利用シーン・音楽用語・文化的文脈** を表すIDです（例: "passionate", "virtuoso", "standard-repertoire", "national-style"）。楽曲の印象や特性を表します。
   - **禁止**: ジャンル・形式のID（"polonaise", "waltz", "nocturne" 等）を \`tags\` に含めてはいけません。これらは \`genres\` フィールド専用です。違反するとバリデーションエラーになります。
8. **洗練された紹介文**: \`description\` は「事実＋フック」構造を守り、ユーザーの知的好奇心を刺激する洗練された日本語（です・ます調）で記述してください。情緒的な煽りや専門用語の羅列は避け、多言語オブジェクト \`{"ja": "..."}\` として出力します。

# 推論プロセス（Chain of Thought）
最終的なJSONを出力する前に、\`_reasoning\` フィールド内で以下の分析ステップを必ず踏んでください。
1. **作品の同定**: 作曲家とタイトルから、作品番号（Op. / KV等）と主調を正確に特定する。
2. **多楽章性の判定**: その作品が単一楽章か多楽章か（ソナタ、交響曲、協奏曲等）を判断し、Workレベルで省略すべき項目を整理する。
3. **編成の分析**: 標準的なオーケストラ編成か、独奏楽器の有無などを確認する。
4. **愛称の検証**: 一般的に通用する「愛称」が実在するか確認する。なければ nickname は null とする。
5. **原曲・編曲の判定**: 入力された作品が原曲か、他の作品の編曲・変奏曲かを確認する。原曲なら basedOn は null とする。
6. **genres と tags の振り分け**: 楽曲の形式・ジャンル（"polonaise", "ternary-form" 等）は genres へ、情緒・印象・文脈（"passionate", "virtuoso" 等）は tags へ振り分ける。ジャンル名を tags に混入させない。

# JSON出力の制約
- **印象評価値**: 必ず -10 から +10 の整数。
- **instruments**: \`musical-instrument.ts\` に定義された有効なIDのみ。
- **tags**: \`musical-tag.ts\` から最大10個。
- **catalogues**: 主要な作品番号を \`isPrimary: true\` として含める。
- **Slugの遵守**: 入力された \`composerSlug\` および \`slug\` を厳格に守ること。`;

export class WorkDraftAgent {
  private agent: BaseAgent;

  constructor(config: { modelName: GeminiModelName }) {
    this.agent = new BaseAgent({
      modelName: config.modelName,
      systemInstruction: SYSTEM_INSTRUCTION,
    });
  }

  /**
   * 楽曲の初期ドラフトデータを生成します。
   */
  async execute(input: {
    composerName: string;
    composerSlug: string;
    workTitle: string;
    slug: string;
  }): Promise<WorkDraft> {
    const prompt = `以下の楽曲のマスターデータを生成してください。

【対象楽曲】
作曲家名: ${input.composerName}
作曲家スラグ: ${input.composerSlug}
楽曲タイトル: ${input.workTitle}
楽曲スラグ: ${input.slug}

# 重要：出力形式の厳守（バリデーションエラー防止）
以下のフィールドは文字列ではなく、**必ず \`{"ja": "..."}\` というオブジェクト形式** で出力してください。
- \`description\`: { "ja": "解説文" }
- \`compositionPeriod\`: { "ja": "作曲時期" }
- \`titleComponents\`: 各子要素（\`prefix\`, \`content\`, \`nickname\`）を個別に多言語オブジェクトとしてください。
  例: \`"prefix": { "ja": "交響曲第3番" }\`

# 参考：正しい出力形式 (One-shot Example)
\`\`\`json
{
  "_reasoning": {
    "作品の同定": "ベートーヴェンの交響曲第3番変ホ長調Op.55『英雄』。多楽章形式。",
    "多楽章性の判定": "全4楽章からなる交響曲。Workレベルではテンポや拍子などの楽章固有の情報はnullとする。",
    "編成の分析": "標準的な2管編成のオーケストラ。独奏楽器なし。",
    "愛称の検証": "『英雄』という広く認知された愛称が存在する。",
    "原曲・編曲の判定": "原曲であり、編曲ではないためbasedOnはnullとする。"
  },
  "titleComponents": {
    "prefix": { "ja": "交響曲第3番" },
    "content": { "ja": "変ホ長調" },
    "nickname": { "ja": "英雄" }
  },
  "description": { "ja": "ナポレオンを讃えるために書かれたものの、その皇帝即位を知り激怒したベートーヴェンが表題を書き換えたという伝説を持つ傑作。重厚な第1楽章から葬送行進曲を経て歓喜の終楽章まで、音楽の歴史を永遠に変えた壮大なシンフォニーです。" },
  "era": "classical",
  "compositionYear": 1804,
  "compositionPeriod": { "ja": "1803年-1804年" },
  "genres": ["symphony"],
  "catalogues": [
    { "prefix": "op", "number": "55", "isPrimary: true }
  ],
  "instruments": ["flute", "oboe", "clarinet", "bassoon", "horn", "trumpet", "timpani", "violin", "viola", "cello", "double-bass"],
  "instrumentationFlags": {
    "isOrchestral": true,
    "isSolo": false,
    "isChamber": false,
    "hasChorus": false,
    "hasVocal": false
  },
  "impressionDimensions": {
    "innovation": 9,
    "emotionality": 8,
    "nationalism": 0,
    "scale": 7,
    "complexity": 7,
    "theatricality": 6
  },
  "tags": ["standard-repertoire", "nicknamed-work", "viennese-classicism", "heroic", "dramatic"]
}
\`\`\`

# 参考：ニックネームや編曲情報がない場合の出力 (Negative Example)
- 固有の愛称がない、かつ原曲（編曲ではない）の場合
- 多楽章形式（ソナタ、協奏曲等）の場合

\`\`\`json
{
  "_reasoning": {
    "作品の同定": "ベートーヴェンのピアノソナタ第1番ヘ短調Op.2-1。多楽章形式。",
    "多楽章性の判定": "全4楽章からなるソナタ。Workレベルではテンポや拍子などの楽章固有の情報はnullとする。",
    "編成の分析": "ピアノ独奏曲。",
    "愛称の検証": "広く認知された愛称は存在しないため、nicknameはnullとする。",
    "原曲・編曲の判定": "原曲であり、編曲ではないためbasedOnはnullとする。"
  },
  "titleComponents": {
    "prefix": { "ja": "ピアノソナタ第1番" },
    "content": { "ja": "ヘ長調" }
    // nickname は存在しないため「プロパティごと省略」
  },
  "era": "classical",
  "compositionYear": 1795,
  "compositionPeriod": { "ja": "1795年" },
  "genres": ["piano-sonata"],
  "catalogues": [
    { "prefix": "op", "number": "2-1", "isPrimary": true }
  ],
  // basedOn は編曲ではないため「プロパティごと省略」
  // tempo, bpm, timeSignature, tempoTranslation は、多楽章形式の楽曲全体 (Work) のため「プロパティごと省略」
  "instruments": ["piano"],
  "instrumentationFlags": {
    "isOrchestral": false,
    "isSolo": true,
    "isChamber": false,
    "hasChorus": false,
    "hasVocal": false
  },
  "impressionDimensions": {
    "innovation": 4, "emotionality": 5, "nationalism": 0, "scale": -2, "complexity": 4, "theatricality": 3
  },
  "tags": ["sonata-form", "standard-repertoire", "early-period"]
}
\`\`\`

# 補足 (重要)
- **多楽章形式の楽曲全体 (Work) では、\`tempo\`, \`bpm\`, \`timeSignature\`, \`tempoTranslation\`, \`metronomeUnit\` などの情報は絶対に出力しないでください。**
- 原曲（編曲でない作品）の場合、\`basedOn\` フィールドは絶対に出力しないでください。「transcription」などは捏造です。
- 固有の愛称（ニックネーム）がない場合、\`nickname\` フィールドは絶対に出力しないでください。「K. 466」などの作品番号や調性を愛称に含めるのは禁止です。
- **ドラフト生成段階では日本語 (ja) のみのデータを出力し、他言語フィールドは含めないでください。**`;

    const result = await this.agent.generateObject<WorkDraft>(prompt, WorkDraftSchema);
    return this.normalize(result);
  }

  /**
   * 楽曲データの正規化（音楽学的な制約に基づくクリーンアップ）を行います。
   */
  private normalize(data: WorkDraft): WorkDraft {
    const res = { ...data } as Record<string, unknown>;

    // 1. 多楽章形式（公認）の場合は、Workレベルの演奏情報を強制削除
    const genres = (res['genres'] as string[]) || [];
    const slug = (res['slug'] as string) || '';

    const isMultiMovement =
      genres.some((g) =>
        ['symphony', 'concerto', 'sonata', 'suite', 'mass', 'opera', 'oratorio'].includes(g),
      ) ||
      slug.includes('concerto') ||
      slug.includes('symphony');

    if (isMultiMovement) {
      delete res['tempo'];
      delete res['bpm'];
      delete res['timeSignature'];
      delete res['tempoTranslation'];
      delete res['metronomeUnit'];
    }

    // 2. basedOn が不完全（原曲スラグがない）場合は削除
    const basedOn = res['basedOn'] as Record<string, unknown> | undefined;
    if (basedOn && !basedOn['originalWorkSlug']) {
      delete res['basedOn'];
    }

    return res as WorkDraft;
  }
}
