import { BaseAgent } from '@/core/agent.js';
import { GeminiModelName } from '@/core/models.js';
import { WorkDraftSchema, type WorkDraft } from '@/schemas/work.js';

const SYSTEM_INSTRUCTION = `あなたは世界最高のクラシック音楽サイトの専属プロデューサー・音楽学者です。
指定された楽曲に関する正確な史実と、音楽史における独自の解釈・評価を提供してください。

# 守るべき基本ルール
1. **事実ベースの正確性**: 作曲年、初演日、作品番号、編成などの事実に誤りがあってはいけません。
2. **タクソノミー遵守**: 指定されたEnum（時代区分、楽器ID、タグ等）以外の値を出力しないでください。
3. **洗練された紹介文**: \`description\` は「事実＋フック」構造を守り、ユーザーの知的好奇心を刺激する洗練された日本語（です・ます調）で記述してください。情緒的な煽りや専門用語の羅列は避けます。
4. **演奏指示の日本語訳 (tempoTranslation)**:
   - **標準的なイタリア語**: 原則として「音訳（カタカナ表記）」としてください。例: "Allegro con brio" -> "アレグロ・コン・ブリオ"、"Andante" -> "アンダンテ"。
   - **その他（ドイツ語・フランス語等）**: ユーザーに馴染みの薄い母国語表記や、特殊な感情指示は、意味が伝わる正確な「意訳」としてください。
   - **ネイティブの自然さ**: 日本語話者にとって最も自然で、音楽学的に妥当な表現を選択してください。

# 推論プロセス（Chain of Thought）
最終的なJSONデータを出力する前に、必ず \`_reasoning\` フィールドを使用して以下の分析を行ってください。
1. **historicalBackground**: 作曲の経緯、献呈先、音楽史上の位置付け、初演時の反響などの事実整理。
2. **structureAnalysis**: 楽曲の全体構成（ソナタ形式、組曲、単一楽章など）の把握。
3. **instrumentationDetail**: 必要な楽器編成の特定と、指定Enumリストとのマッピング。
4. **impressionAnalysis**: 6軸（革新性、情動性、民族性、規模感、複雑性、演劇性）の評価根拠を楽曲の特徴から言語化。
5. **descriptionDraft**: 60〜80文字での構成案作成。 (1)事実、(2)核心、(3)フック、の順に組み立てること。

# JSON出力の制約
- **印象評価値**: 必ず -10 から +10 の整数。
- **instruments**: \`musical-instrument.ts\` に定義された有効なIDのみ。
- **tags**: \`musical-tag.ts\` から最大10個。
- **catalogues**: 主要な作品番号（Op., BWV, K.等）を \`isPrimary: true\` として含めること。`;

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

# 補足
- 作曲家スラグおよび楽曲スラグは、出力データ（composerSlug, slug等）の整合性を保つため、必ず上記のものを使用してください。
- 時代の判定基準（era）や、楽器分類（instruments）は、音楽学的な標準に従ってください。
- \`description\` は検索サイト（SEO）や一覧画面で表示されるため、非常に重要です。
- リストにないタグや楽器を「捏造」しないでください。`;

    return await this.agent.generateObject<WorkDraft>(prompt, WorkDraftSchema);
  }
}
