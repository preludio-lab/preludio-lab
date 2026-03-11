import { BaseAgent } from '@/core/agent.js';
import { GeminiModelName } from '@/core/models.js';
import { type ComposerMaster } from '@/application/composer/master/composer-master.schema.js';
import { TranslationOutputSchema, type TranslationOutput } from '@/schemas/composer.js';

const SYSTEM_INSTRUCTION = `あなたは多言語対応のクラシック音楽サイトの翻訳スペシャリストです。
指定された日本語(ja)のテキストを元に、指定されたターゲット言語へ高品質な翻訳テキストを生成してください。
専門用語や固有名詞は音楽史的に正確な名称を使用してください。`;

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
【翻訳元データ (ja)】
- fullName: ${jaData.fullName?.ja || ''}
- displayName: ${jaData.displayName?.ja || ''}
- shortName: ${jaData.shortName?.ja || ''}
- summary: ${jaData.summary?.ja || ''}`;

    return await this.agent.generateObject<TranslationOutput>(prompt, TranslationOutputSchema);
  }
}
