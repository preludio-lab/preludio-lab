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
  /** 最新の軽量・高速モデル */
  FLASH_LITE: 'gemini-3.1-flash-lite-preview',
  /** 高速・低コストな標準モデル */
  FLASH: 'gemini-3-flash-preview',
  /** 開発・テスト用の安定版（汎用） */
  STABLE_FLASH: 'gemini-2.5-flash',
  /** 開発・テスト用の安定版（軽量） */
  STABLE_FLASH_LITE: 'gemini-2.5-flash-lite',
  /** 高度な推論・構造遵守が必要な場合の大規模モデル */
  PRO: 'gemini-1.5-pro-latest',
  /** 試験的なGemmaベースモデル */
  GEMMA_3_12B: 'gemma-3-12b-it',
} as const;

/**
 * GeminiModelName 型は GeminiModels 定数の値のいずれかのみを許容します。
 */
export type GeminiModelName = (typeof GeminiModels)[keyof typeof GeminiModels];

/**
 * エージェントとユーザー間のやり取り（会話履歴）を表現するメッセージインターフェース
 */
export interface Message {
  role: 'user' | 'assistant';
  content: string;
}
