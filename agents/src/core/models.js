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
  /** 画像生成・解析に特化したモデル */
  IMAGE: 'gemini-3-pro-image-preview',
  /** 開発・テスト用の安定版モデル */
  STABLE_FLASH: 'gemini-2.5-flash',
};
