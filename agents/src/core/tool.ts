import { z } from 'zod';

/**
 * ツール実行時のコンテキスト情報。
 * エージェントの内部状態や構成情報をツール側で参照する必要がある場合に使用します。
 */
export interface ToolContext {
  /** ツールを呼び出しているエージェントのモデル名（例: 'gemini-3-flash-preview'） */
  modelName?: string;
}

/**
 * エージェントが自律的に使用する機能（ツール）の基本インターフェース。
 *
 * Function Calling の仕様に準拠するため、ツールのメタ情報（名前、説明）と、
 * 入出力を型安全に検証するための Zod スキーマを強制します。
 * 全てのカスタムツールはこのインターフェースを実装する必要があります。
 */
export interface AgentTool<I = unknown, O = unknown> {
  /**
   * ツールの識別名。Gemini の `FunctionDeclaration` における `name` として登録されます。
   * 特殊文字を含まない、キャメルケースの識別子（例: `githubUserFetcher`）を推奨します。
   */
  name: string;

  /**
   * ツールの詳細な説明文。
   * LLM（エージェント）が「どのツールを利用すべきか」「どのように引数を渡すべきか」を判断する際の
   * 非常に重要な判断基準となるため、具体的かつ明確に記述してください。
   */
  description: string;

  /**
   * ツールの入力パラメータを定義した Zod スキーマ。
   * これにより、LLM に提示する JSON Schema が自動生成され、同時に実行時の引数の型検証が行われます。
   */
  inputSchema: z.ZodType<I>;

  /**
   * ツールの実際の実行ロジック。
   * LLM によって生成され、`inputSchema` による検証を通過した安全な引数を受け取ります。
   *
   * @param input Zod スキーマで検証および型付けされた入力値
   * @param context 実行時のコンテキスト情報（呼び出し元のモデル名など）
   * @returns 実行結果。通常は JSON 化可能なオブジェクトや文字列を返します。
   * @throws {Error} 実行中の予期せぬエラー（ネットワーク切断、権限エラーなど）
   */
  execute(input: I, context?: ToolContext): Promise<O>;
}
