import { z } from 'zod';

/**
 * エージェントが使用するツールの基本インターフェース。
 * Function Calling に対応するため、名前、説明、入力スキーマ（Zod）を定義します。
 */
export interface AgentTool<I = unknown, O = unknown> {
  /** ツールの識別名（Gemini Function Declarationとして使われる） */
  name: string;

  /** ツールの説明文。LLMがツールを選択する際に重要な判断基準となります。 */
  description: string;

  /** ツールの入力パラメータのZodスキーマ。型安全とLLMへのスキーマ提示を両立します。 */
  inputSchema: z.ZodType<I>;

  /** ツールの実行ロジック。LLMが生成した入力値を受け取り、結果を返します。 */
  execute(input: I): Promise<O>;
}
