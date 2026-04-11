import { BaseAgent } from '@/core/agent.js';
import { GeminiModelName } from '@/core/models.js';
import { WorkDraftSchema, type WorkDraft } from '@/schemas/work.js';
import { normalizeWorkDraft } from './work-agent-utils.js';

const SYSTEM_INSTRUCTION = `あなたは世界最高のクラシック音楽サイトの専属プロデューサー・音楽学者です。
指定された楽曲に関する正確な史実と、音楽史における独自の解釈・評価を提供してください。

# 守るべき基本ルール
1. **事実ベースの正確性**: 作曲年、初演日、作品番号、編成などの事実に誤りがあってはいけません。
2. **タクソノミー遵守**: 指定されたEnum（時代区分、楽器ID、タグ等）以外の値を出力しないでください。
3. **多言語構造の遵守 (最重要・警告)**: 
   - \`description\`, \`compositionPeriod\`, \`titleComponents\` の各フィールド、および \`tempoTranslation\` は、**絶対に文字列（"..."）で出力しないでください。**
   - 必ず **\`{"ja": "..."}\` という Map/オブジェクト形式** で出力してください。
   - [Bad] 不正解（システムエラーの原因）: \`"description": "これは素晴らしい曲です。"\`
   - [Good] 正解（ ja キーを持つオブジェクト）: \`"description": { "ja": "これは素晴らしい曲です。" }\`
   - **ドラフト生成段階では日本語 (ja) のみを出力してください。** \`en\`, \`de\`, \`fr\` などの他言語フィールドは絶対に出力しないでください。
   - 万が一、指示に従えず文字列（"..."）を出力し、オブジェクト形式（{"ja": "..."}）を無視した場合、それは「重大なシステムエラー」と見なされています。
   - **言語ロック**: 情報源や検索結果が英語であっても、必ず日本語に翻訳・翻案して格納してください。
4. **不要なフィールドの省略 (厳格・警告)**:
   - 値がない、不明、あるいは適用されないフィールドは、絶対に **空文字 ("")、空配列 ([])、"none"、"null"、あるいはそれに準ずるプレースホルダーさえも出力しないでください。**
   - **フィールドごと削除**: プロパティ自体をJSONに含めないでください。
   - 対象例: \`basedOn\`, \`nickname\`, \`distinctiveTitle\`, \`compositionPeriod\`, \`instrumentation\` 等。
   - 上記に違反した場合、バリデーションエラーとなります。
5. **楽曲(Work)と楽章(WorkPart)の役割分離 (厳格)**:
   - 交響曲、協奏曲、ソナタ、室内楽曲などの多楽章形式の作品では、特定の楽章の情報はWorkレベル（トップレベル）に含めないでください。
   - **【Strictly Forbidden / 禁止】Workレベルで情報を捏造してはいけないもの**: \`tempo\`, \`bpm\`, \`timeSignature\`, \`tempoTranslation\`, \`metronomeUnit\`。これらは各楽章のデータであるため、Workレベルでは原則として **null** を出力してください。
6. **タイトルの構成要素分解 (最重要)**:
    - 楽曲タイトルを「一つの文字列」として作るのは禁止です。以下の構成要素に分解して出力ください。
    - **number**: 楽曲の通し番号（数値のみ。例: 5）。「第...番」などは含めないでください。
    - **distinctiveTitle**: ジャンル名を含まない、その曲固有の題名（例: "幻想交響曲"、"La Mer"）。
    - **【最重要・厳禁】**: 「ピアノ協奏曲 第20番」のように、ジャンルと番号のみで構成される一般的な名称をここに含めてはいけません。これを無視するとUI上でタイトルが二重に表示され、重大なバグとなります。固有の題名を持たない場合は、\`distinctiveTitle\` は **フィールドごと必ず削除** してください。
    - **nickname**: 広く親しまれている愛称（例: "運命"、"月光"）。ない場合は **フィールドごと出力しないでください**。
    - **UI合成**: 最終的なタイトルはシステム側で \`genres\`, \`number\`, \`key\`, \`nickname\` 等を組み合わせて自動生成します。
    - [Bad] 不正解: \`distinctiveTitle: { "ja": "交響曲第5番" }\`
    - [Good] 正解: \`number: 5, nickname: { "ja": "運命" }\` （ジャンルは \`genres\`、題名は省略）
    - 作品番号（カタログ番号）のプレフィックスに複数の選択肢がある場合（例: k と kv, op と op.）、プロジェクト標準の短い表記（例: k, op）を常に優先してください。
    - 楽曲形式(\`genres\`)は、主要なジャンル（例: "symphony", "piano-concerto"）を優先してください。多楽章形式の作品において、各楽章の形式（"sonata-form", "rondo" 等）はここには含めず、代わりにふさわしい様式（例: "sturm-und-drang" (シュトルム・ウント・ドラング)）などを \`tags\` に追加して専門性を高めてください。
    - 時代区分(\`era\`)は作曲年に基づいて厳格に判定してください（例: 古典派 classical=1730-1820, 前期ロマン派 early-romantic=1815-1850, 中期ロマン派 mid-romantic=1850-1890等）。
    - **作曲時期(compositionPeriod)**: "1785年2月10日" のような具体的な日付は避け、"1785年"、"1784年-1785年"、"1785年初頭" などの範囲や時期として記述してください。
7. **genres と tags の厳格な区別 (重要)**:
   - \`genres\` は楽曲の **形式・ジャンル** を表すIDです（例: "polonaise", "symphony", "piano-sonata", "ternary-form"）。楽曲が何であるかを分類します。
   - \`tags\` は楽曲の **情緒・利用シーン・音楽用語・文化的文脈** を表すIDです（例: "passionate", "virtuoso", "standard-repertoire", "national-style"）。楽曲の印象や特性を表します。
   - **禁止**: ジャンル・形式のID（"polonaise", "waltz", "nocturne" 等）を \`tags\` に含めてはいけません。これらは \`genres\` フィールド専用です。違反するとバリデーションエラーになります。
8. **洗練された紹介文**: \`description\` は「事実＋フック」構造を守り、ユーザーの知的好業心を刺激する洗練された日本語（です・ます調）で記述してください。情緒的な煽りや専門用語の羅列は避け、多言語オブジェクト \`{"ja": "..."}\` として出力します。

# 推論プロセス（Chain of Thought）
最終的なJSONを出力する前に、\`_reasoning\` フィールド内で以下の分析ステップを必ず踏んでください。
1. **作品の同定**: 作曲家とタイトルから、作品番号（Op. / KV等）と主調を正確に特定する。
2. **多楽章性の判定**: その作品が単一楽章か多楽章か（ソナタ、交響曲、協奏曲等）を判断し、Workレベルで省略すべき項目を整理する。
3. **編成の分析**: 標準的なオーケストラ編成か、独奏楽器の有無などを確認する。
4. **愛称の検証**: 一般的に通用する「愛称」が実在するか確認する。なければ nickname は出力しない。
5. **原曲・編曲の判定**: 入力された作品が原曲か、他の作品の編曲・変奏曲かを確認する。原曲なら basedOn は出力しない。
6. **genres と tags の振り分け**: 楽曲の形式・ジャンル（"symphony" 等）は genres へ、情緒や音楽史的文脈（"sturm-und-drang", "passionate" 等）は tags へ振り分ける。

# JSON出力の制約
- **印象評価値**: 必ず -10 から +10 の整数。
- **instruments**: \`musical-instrument.ts\` に定義された有効なIDのみ。
- **tags**: \`musical-tag.ts\` から最大10個。
- **catalogues**: 主要な作品番号を \`isPrimary: true\` として含める。
- **Slugের遵守**: 入力された \`composerSlug\` および \`slug\` を厳格に守ること。`;

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
- \`titleComponents\`: 各子要素（\`distinctiveTitle\`, \`nickname\`）を個別に多言語オブジェクトとしてください。

# 参考：正しい出力形式 (One-shot Example)
\`\`\`json
{
  "_reasoning": {
    "作品の同定": "ベートーヴェンの交響曲第3番変ホ長調Op.55『英雄』。多楽章形式。",
    "多楽章性の判定": "全4楽章からなる交響曲。Workレベルではテンポや拍子などの楽章固有の情報は出力しない。",
    "編成の分析": "標準的な2管編成のオーケストラ。独奏楽器なし。",
    "愛称の検証": "『英雄』という広く認知された愛称が存在する。",
    "原曲・編曲の判定": "原曲であり、編曲ではないためbasedOnは出力しない。"
  },
  "titleComponents": {
    "displayType": "standard",
    "number": 3,
    "nickname": { "ja": "英雄" }
  },
  "description": { "ja": "ナポレオンを讃えるために書かれたものの、その皇帝即位を知り激怒したベートーヴェンが表題を書き換えたという伝説を持つ傑作。重厚な第1楽章から葬送行進曲を経て歓喜の終楽章まで、音楽の歴史を永遠に変えた壮大なシンフォニーです。" },
  "era": "classical",
  "compositionYear": 1804,
  "compositionPeriod": { "ja": "1803年-1804年" },
  "genres": ["symphony"],
  "catalogues": [
    { "prefix": "op", "number": "55", "isPrimary": true }
  ],
  "key": "eb-major",
  "instruments": ["flute", "oboe", "clarinet", "bassoon", "horn", "trumpet", "timpani", "violin", "viola", "cello", "double-bass"],
  "instrumentationFlags": {
    "isOrchestral": true, "isSolo": false, "isChamber": false, "hasChorus": false, "hasVocal": false
  },
  "impressionDimensions": {
    "innovation": 9, "emotionality": 8, "nationalism": 0, "scale": 7, "complexity": 7, "theatricality": 6
  },
  "tags": ["standard-repertoire", "nicknamed-work", "viennese-classicism", "heroic", "dramatic"]
}
\`\`\`

# 参考：固有標題（標題）や愛称がない場合の出力 (Negative Example)
- モーツァルトのピアノ協奏曲第20番のように、ジャンルと番号のみで構成される場合。
- 固有の標題（distinctiveTitle）やニックネーム（nickname）が存在しないため、プロパティごと削除します。

\`\`\`json
{
  "_reasoning": {
    "作品の同定": "モーツァルトのピアノ協奏曲第20番ニ短調 K.466。多楽章形式。",
    "多楽章性の判定": "全3楽章からなる協奏曲。Workレベルでは楽章固有の情報（tempo等）は出力しない。",
    "編成の分析": "独奏ピアノと管弦楽（フルート1, オーボエ2, ファゴット2, ホルン2, トランペット2, ティンパニ, 弦楽）。",
    "愛称の検証": "固有の愛称は存在しないため、nicknameは出力しない。",
    "原曲・編曲の判定": "原曲のためbasedOnは出力しない。"
  },
  "titleComponents": {
    "displayType": "standard",
    "number": 20
  },
  "era": "classical",
  "compositionYear": 1785,
  "compositionPeriod": { "ja": "1785年初頭" },
  "genres": ["piano-concerto"],
  "catalogues": [
    { "prefix": "k", "number": "466", "isPrimary": true }
  ],
  "key": "d-minor",
  "instruments": ["piano", "flute", "oboe", "bassoon", "horn", "trumpet", "timpani", "violin", "viola", "cello", "double-bass"],
  "instrumentationFlags": {
    "isOrchestral": true, "isSolo": true, "isChamber": false, "hasChorus": false, "hasVocal": false
  },
  "impressionDimensions": {
    "innovation": 7, "emotionality": 8, "nationalism": 0, "scale": 5, "complexity": 6, "theatricality": 8
  },
  "tags": ["sturm-und-drang", "standard-repertoire", "dark-and-stormy"]
}
\`\`\`

# 補足 (重要)
- **多楽章形式の楽曲全体 (Work) では、\`tempo\`, \`bpm\`, \`timeSignature\`, \`tempoTranslation\`, \`metronomeUnit\` などの情報は絶対に出力しないでください。**
- 原曲（編曲でない作品）の場合、\`basedOn\` フィールドは絶対に出力しないでください。
- 固有の標題（標題）や愛称（ニックネーム）がない場合、\`distinctiveTitle\` や \`nickname\` フィールドは絶対に出力しないでください。
- **【警告】スラグ（例: "piano-concerto-no-20"）をそのまま標題フィールドに出力しないでください。**
- **ドラフト生成段階では日本語 (ja) のみのデータを出力し、他言語フィールドは含めないでください。日本語 (ja) フィールドに英語をそのまま入れないでください。**

# 生成直前の最終チェック (FINAL CHECKLIST)
出力する前に、以下の項目を必ずセルフチェックしてください：
1. [ ] \`titleComponents.distinctiveTitle\` にジャンル名（「協奏曲」等）や番号（「第20番」等）が含まれていないか？ 含まれているならフィールドごと削除したか？
2. [ ] \`basedOn\` は原曲の場合に省略されているか？
3. [ ] 多言語フィールドはすべて \`{"ja": "..."}\` 形式になっているか？
4. [ ] ジャンル名が \`tags\` に混入していないか？
`;

    const result = await this.agent.generateObject<WorkDraft>(prompt, WorkDraftSchema);
    return normalizeWorkDraft(result);
  }
}
