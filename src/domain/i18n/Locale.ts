import { z } from 'zod';

/**
 * Preludio Lab でサポートされるロケール定義。
 * このファイルはドメイン層における言語定義の「信頼できる唯一の情報源 (Source of Truth)」として機能します。
 */

export const AppLocale = {
  /** 英語 (デフォルト) - 国際的な主要言語 */
  EN: 'en',
  /** 日本語 - 開発者の母国語であり、主要なターゲット */
  JA: 'ja',
  /** スペイン語 */
  ES: 'es',
  /** ドイツ語 */
  DE: 'de',
  /** フランス語 */
  FR: 'fr',
  /** イタリア語 */
  IT: 'it',
  /** 中国語 */
  ZH: 'zh',
} as const;

/**
 * アプリケーション内で使用可能な言語コードの型定義。
 * `typeof AppLocale` の値のユニオン型です。
 */
export type AppLocale = (typeof AppLocale)[keyof typeof AppLocale];

/**
 * デフォルトの言語設定。
 * URLにロケールが含まれない場合や、非サポート言語へのアクセス時にフォールバックとして使用されます。
 */
export const defaultLocale: AppLocale = AppLocale.EN;

/**
 * サポートされている全言語の配列。
 * ルーティングやミドルウェアの設定で使用されます。
 */
export const supportedLocales: AppLocale[] = [
  AppLocale.EN, // 世界標準
  AppLocale.DE, // クラシック音楽の主要国 (バッハ、ベートーヴェン等)
  AppLocale.FR, // クラシック音楽の主要国
  AppLocale.IT, // 音楽用語の起源
  AppLocale.ES, // 世界的な広がり
  AppLocale.JA, // 親和性の高い市場 (開発者の拠点)
  AppLocale.ZH, // 成長市場
];

/**
 * UI表示用の言語ラベル定義。
 * 言語切り替えスイッチャーなどで使用されます。
 */
export const localeLabels: Record<AppLocale, string> = {
  [AppLocale.EN]: 'English',
  [AppLocale.DE]: 'Deutsch',
  [AppLocale.FR]: 'Français',
  [AppLocale.IT]: 'Italiano',
  [AppLocale.ES]: 'Español',
  [AppLocale.JA]: '日本語',
  [AppLocale.ZH]: '中文',
};

/**
 * 多言語対応の文字列スキーマのオプション
 */
export type MultilingualStringOptions = {
  /** 最小文字数 (空文字を許容しない場合は 1 を設定) */
  min?: number;
  /** 最大文字数 */
  max?: number;
  /** 正規表現パターン (RegExpオブジェクトまたは文字列) */
  pattern?: string | RegExp;
  /** 自動トリムを行うか (デフォルト: true) */
  trim?: boolean;
};

/**
 * 多言語対応の文字列コンテナを作成するヘルパー
 * 各言語の文字列に対して一律で制約を適用できます。
 */
export const createMultilingualStringSchema = (options: MultilingualStringOptions = {}) => {
  const { min, max, pattern, trim = true } = options;

  // ベースとなる文字列スキーマ
  let baseSchema = z.string();

  // ホワイトスペースの自動除去設定
  if (trim) {
    baseSchema = baseSchema.trim();
  }

  // 文字数制限や正規表現などの制約を合成
  if (min !== undefined) baseSchema = baseSchema.min(min);
  if (max !== undefined) baseSchema = baseSchema.max(max);
  if (pattern !== undefined) {
    const regex = typeof pattern === 'string' ? new RegExp(pattern) : pattern;
    baseSchema = baseSchema.regex(regex);
  }

  // すべての項目はオプショナル（プロパティ自体が省略可能）として定義
  const field = baseSchema.optional();

  return z.object({
    [AppLocale.EN]: field,
    [AppLocale.JA]: field,
    [AppLocale.ES]: field,
    [AppLocale.DE]: field,
    [AppLocale.FR]: field,
    [AppLocale.IT]: field,
    [AppLocale.ZH]: field,
  });
};

/**
 * 標準（制約なし）の多言語対応文字列スキーマ
 */
export const MultilingualStringSchema = createMultilingualStringSchema();

export type MultilingualString = z.infer<typeof MultilingualStringSchema>;
