/**
 * Gemini モデル定義
 *
 * プロジェクト全体で使用するモデル名を一元管理し、
 * マジックストリングの排除と型安全なモデル指定を実現します。
 */

/**
 * 利用可能な Gemini モデル名の定数マップ。
 * 新しいモデルが追加された場合はここに追記します。
 */
export const GeminiModels = {
  /** 高速・低コスト。ツール呼び出しやバッチ処理に最適 */
  FLASH: 'gemini-3-flash-preview',
  /** 高精度。複雑な推論や高品質な出力が必要な場面向け */
  PRO: 'gemini-3.1-pro-preview',
} as const;

/**
 * `GeminiModels` の値から導出されるモデル名のユニオン型。
 * `AgentConfig.modelName` に代入できる値をコンパイル時に制限します。
 *
 * @example
 * ```ts
 * const name: GeminiModelName = GeminiModels.FLASH; // OK
 * const bad: GeminiModelName = 'invalid-model';     // コンパイルエラー
 * ```
 */
export type GeminiModelName = (typeof GeminiModels)[keyof typeof GeminiModels];
