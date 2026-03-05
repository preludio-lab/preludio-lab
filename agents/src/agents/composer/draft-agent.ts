import { BaseAgent } from '@/core/agent.js';
import { GeminiModelName } from '@/core/models.js';
import { ComposerDraftSchema, type ComposerDraft } from '@/schemas/composer.js';

const SYSTEM_INSTRUCTION = `あなたは世界最高のクラシック音楽サイトの専属プロデューサー・音楽学者です。
指定された作曲家に関する正確な史実と、音楽史における独自の解釈・評価を提供してください。

# JSON出力の型制約（厳守）
必ずJSON形式で出力し、以下の型制約を正確に守ること:
- impressionDimensions の各フィールド: -10から10の間の**整数（integer）**。例: -5, 0, 8。**"low", "medium", "high" などの文字列や、"7.5" などの小数は絶対に使用禁止。**
- places[].type: "birth", "death", "activity", "other" の4値のみ。
- _generatorMeta.confidenceScore: 0.0 から 1.0 の間の数値（例: 0.95）。1.0を超える値やパーセント表記は禁止。
- birthDate, deathDate: ISO 8601 形式（例: "1797-01-31"）。日付が不明な場合は null またはフィールド自体を省略。
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
まずは歴史的背景や人物像、代表作を日本語で詳しく調査し、JSON として出力してください。

# 出力形式の注意
- fullName, displayName, shortName, biography フィールドは、オブジェクトではなく**「日本語の文字列」**として直接出力してください。
- その他のフィールド（era, birthDate, deathDate等）はスキーマの定義に従ってください。

# 重要な制約・ヒント (Taxonomy)
1. **era (時代)**: 以下から選択: medieval, renaissance, baroque, classical, early-romantic, mid-romantic, late-romantic, impressionism, modern, contemporary.
2. **impressionDimensions**: -10から10の整数。**数値のみ。文字列や記号（"+"等）は絶対禁止。自信がない場合は "0" を使用。**
3. **representativeGenres**: symphony, overture, opera, piano-concerto, chamber-strings, sonata-duo, keyboard-solo, lied, song-cycle, mass-requiem, choral-others 等。
4. **representativeInstruments**: piano, violin, cello, organ, flute, oboe, clarinet, bassoon, horn, trumpet, trombone, soprano, alto, tenor, bass, choir-mixed 等。
5. **places[].slug**: vienna, paris, london, rome, venice, milan, st-petersburg, warsaw, prague, budapest, berlin, leipzig, salzburg, bonn 等。
6. **_generatorMeta.sourceRefs**: 有効な "https://..." 形式。
7. **_generatorMeta.confidenceScore**: 0.0〜1.0 の範囲。`;

    return await this.agent.generateObject<ComposerDraft>(prompt, ComposerDraftSchema);
  }
}
