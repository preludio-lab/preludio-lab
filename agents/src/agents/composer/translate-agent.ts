import { BaseAgent } from '@/core/agent.js';
import { GeminiModelName } from '@/core/models.js';
import { type ComposerMaster } from '@/application/composer/master/composer-master.schema.js';
import { TranslationOutputSchema, type TranslationOutput } from '@/schemas/composer.js';

const SYSTEM_INSTRUCTION = `あなたは多言語対応のクラシック音楽サイトの翻訳・ローカライゼーションスペシャリストです。
指定された日本語(ja)のテキストを元に、ターゲット言語へ高品質かつ自然な翻訳テキストを生成してください。

# 守るべき基本原則
1. **公式な綴りの採用**: 人名や地名は、ターゲット言語圏において最も一般的かつ公式な綴りを採用してください。
2. **漢字圏の音訳**: 中国語(zh)や日本語(ja)などの漢字・カタカナ圏における欧米の人名は、必ず音訳（phonetic transliteration）された現地表記（例: 肖邦、贝多芬）を採用し、フルネームは「·（中黒）」を用いて姓名を区切ってください。
3. **音楽史的正確性**: 専門用語や作品タイトルは、音楽史的に正確な名称を使用してください。
4. **タイポグラフィの最適化**: 作品名の引用符（日本語の『』）は、ターゲット言語の標準的な記号（英語: '', フランス語: « », 中国語: 《 》等）に必ず変換してください。
5. **UI制約の継承**: 翻訳後の文章も、日本語ドラフトの「親密でミニマム」なトーンを維持し、UIのカードレイアウトに収まるよう簡潔に保ってください（冗長な直訳は避けてください）。`;

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
  async execute(jaData: ComposerMaster, _targetLang: string): Promise<TranslationOutput> {
    const prompt = `あなたは多言語対応のクラシック音楽サイトのネイティブ・ローカライゼーション専門家です。
「日本語からの直訳」ではなく、それぞれのターゲット言語圏の音楽文化（主要な音楽配信サービス、学術的な事典、ネイティブの聴衆）における**最も一般的かつプロフェッショナルな標準表記**を採用してください。

【厳格な遵守ルール】
1. **ネイティブ水準の自然さ**: 日本語の入力に含まれる文化的ニュアンスや「日本独自の愛称」に引きずられないこと。ターゲット言語圏でその楽曲や作曲家がどう呼ばれているかを最優先し、必要に応じてリライトすること。
   - 例: ベートーヴェン5番を英語で 'Fate Symphony' と呼ぶのは日本的なバイアスです。英語圏の標準である 'Fifth Symphony' を優先してください。
   - 一方で、'Moonlight Sonata' (EN) や « La Mer » (FR) のように、その言語で定着している愛称は積極的に採用してください。
2. **データの完全性の保持**: \`fullName\` フィールドはマスターデータとして、ターゲット言語における正確なフルネーム（ファーストネーム・ミドルネーム等を含む）を一切省略せずに出力すること。
3. **言語ごとの正書法とタイポグラフィ**: 各言語の学術的・文化的に正しい綴りと記号を厳格に適用すること。
   - **EN**: 国際的な標準綴りを使用。引用符はシングルクォート ' '。
   - **FR**: クロード・アシル等のハイフン、アクサン（é）を厳守。引用符はギュメ « » (前後にスペース)。
   - **DE**: イニシャルの空白（J. S. Bach）やウムラウトを厳守。引用符はドイツ式 „ “。
   - **ZH**: 標準的な音訳漢字と中黒（·）を使用。作品名は必ず書名号 《》 を使用。Beethovenのvanは「范」を用いる等、音楽学的な慣例に従うこと。
   - **ES/IT**: その言語の標準的な音訳（Chaikovski / Čajkovskij 等）と、自国語に翻訳された作品タイトルを採用すること。引用符は « » または ' '。
4. **冗長性の排除**: 翻訳時に意味の重複（例: ドイツの〜ドイツの作曲家）が発生する場合は、ネイティブにとって自然な文脈になるよう文章を整理すること。
5. **要約の凝縮感**: 日本語ドラフトの「親密でミニマム」なトーン（60〜100文字程度の凝縮感）を維持し、1〜2文の簡潔で魅力的な要約に仕上げること。

【翻訳元データ (ja)】
- fullName: ${jaData.fullName?.ja || ''}
- displayName: ${jaData.displayName?.ja || ''}
- shortName: ${jaData.shortName?.ja || ''}
- summary: ${jaData.summary?.ja || ''}`;

    return await this.agent.generateObject<TranslationOutput>(prompt, TranslationOutputSchema);
  }
}
