import { BaseAgent } from '@/core/agent.js';
import { GeminiModelName } from '@/core/models.js';
import { type ComposerMaster } from '@/application/composer/master/composer-master.schema.js';
import { TranslationOutputSchema, type TranslationOutput } from '@/schemas/composer.js';

const SYSTEM_INSTRUCTION = `あなたは多言語対応のクラシック音楽サイトの翻訳・ローカライゼーションスペシャリストです。
指定された日本語(ja)のテキストを元に、ターゲット言語へ高品質かつ自然な翻訳テキストを生成してください。

# 守るべき基本原則
1. **公式な綴りの採用**: 人名や地名は、ターゲット言語圏において最も一般的かつ公式な綴り（キリル文字圏ならラテン翻字、漢字圏なら現地表記等）を採用してください。
2. **音楽史的正確性**: 専門用語や作品タイトルは、音楽史的に正確な名称を使用してください。
3. **タイポグラフィの最適化**: 作品名の引用符（日本語の『』）は、ターゲット言語の標準的な記号（英語: '', フランス語: « », 中国語: 《 》等）に必ず変換してください。
4. **UI制約の継承**: 翻訳後の文章も、日本語ドラフトの「親密でミニマム」なトーンを維持し、UIのカードレイアウトに収まるよう簡潔に保ってください（冗長な直訳は避けてください）。`;

export class ComposerTranslateAgent {
  private agent: BaseAgent;

  constructor(config: { modelName: GeminiModelName }) {
    this.agent = new BaseAgent({
      modelName: config.modelName,
      systemInstruction: SYSTEM_INSTRUCTION,
    });
  }

  /**
   * 日本語の入力データを指定された言語へ翻訳します。
   */
  async execute(jaData: ComposerMaster, targetLang: string): Promise<TranslationOutput> {
    const prompt = `以下の日本語(ja)テキストについて、ターゲット言語 '${targetLang}' の翻訳を生成してください。

【制約事項】
- **summary の長さ**: ターゲット言語で読みやすく、かつカードレイアウトを崩さない程度の簡潔さを保ってください。冗長な直訳は避け、日本語ドラフトのミニマムな魅力を再現してください。
- **引用符**: 日本語の作品引用符『』を、ターゲット言語に適した記号（'' や « » 等）へ適切に変換してください。
- **正確性**: 音楽史的な正確性と、ターゲット言語における標準的な綴りを維持してください。

【翻訳元データ (ja)】
- fullName: ${jaData.fullName?.ja || ''}
- displayName: ${jaData.displayName?.ja || ''}
- shortName: ${jaData.shortName?.ja || ''}
- summary: ${jaData.summary?.ja || ''}`;

    return await this.agent.generateObject<TranslationOutput>(prompt, TranslationOutputSchema);
  }
}
