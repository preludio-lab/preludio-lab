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
