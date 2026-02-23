import {
  GoogleGenerativeAI,
  GenerativeModel,
  FunctionDeclaration,
  SchemaType,
  Schema,
  Tool as GeminiTool,
  ModelParams,
  DynamicRetrievalMode,
  Part,
} from '@google/generative-ai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { consola } from 'consola';
import { AgentTool } from './tool.js';
import { GeminiModelName } from './models.js';
import { env } from './env.js';

/**
 * エージェントの初期化設定を定義するインターフェース。
 */
export interface AgentConfig {
  /** 使用する Gemini モデル名。`GeminiModels` 定数から選択します。 */
  modelName: GeminiModelName;
  /** システムプロンプト（ペルソナやルールの定義） */
  systemInstruction?: string;
  /** Google Search を回答の裏付け（Grounding）として利用するかどうか */
  enableGrounding?: boolean;
}

/**
 * Google Generative AI SDK (Gemini) をラップした基底エージェントクラス。
 * プロジェクト全体で一貫した型安全な推論と、Function Calling（ツールの自律実行）を提供します。
 */
export class BaseAgent {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  /**
   * BaseAgent のインスタンスを生成します。
   * 環境変数 `GEMINI_API_KEY` の設定が必須です。
   *
   * @param config エージェントのモデル名やシステムプロンプトを含む設定オブジェクト
   * @throws {Error} `GEMINI_API_KEY` が環境変数に設定されていない場合
   */
  constructor(config: AgentConfig) {
    const apiKey = env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set.');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);

    const modelConfig: ModelParams = {
      model: config.modelName,
    };

    if (config.systemInstruction) {
      modelConfig.systemInstruction = config.systemInstruction;
    }

    if (config.enableGrounding) {
      // Gemini の Grounding (Google Search) を有効化
      modelConfig.tools = [
        {
          googleSearchRetrieval: {
            dynamicRetrievalConfig: {
              mode: DynamicRetrievalMode.MODE_DYNAMIC,
              dynamicThreshold: 0.3, // 一般的な推奨しきい値
            },
          },
        },
      ];
    }

    this.model = this.genAI.getGenerativeModel(modelConfig);
  }

  /**
   * 単純な構造化出力 (JSON Mode) を生成します。
   * ユーザーからのプロンプトに対し、指定された Zod スキーマに完全に合致する JSON オブジェクトを返します。
   *
   * @param prompt ユーザーからの指示（プロンプト）文字列
   * @param schema 出力として期待するデータ構造を定義した Zod スキーマ
   * @returns スキーマの検証を通過したパース済みのオブジェクト
   * @throws {Error} Gemini のレスポンスが JSON として不正な場合、またはスキーマ検証に失敗した場合
   */
  async generateObject<T>(prompt: string, schema: z.ZodType<T>): Promise<T> {
    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
      },
    });

    const responseText = result.response.text();
    try {
      const parsed = JSON.parse(responseText);
      return schema.parse(parsed);
    } catch (error) {
      consola.error('[BaseAgent] Failed to parse JSON response or validate against schema.');
      consola.debug('Response text:', responseText);
      throw error;
    }
  }

  /**
   * ツールを使用した対話実行 (Function Calling) を行います。
   * エージェントに利用可能なツールの定義（OpenAPI スキーマ）を与え、
   * LLM の推論によって自律的にツールを選択・実行・結果解析を繰り返しながら、最終的なテキスト回答を生成します。
   *
   * @param prompt ユーザーからの初期指示（プロンプト）文字列
   * @param tools このスレッド内でエージェントが利用できる `AgentTool` インターフェースを実装したツールの配列
   * @returns ツール実行の結果を踏まえて生成された、エージェントからの最終的なテキスト回答
   * @throws {Error} 存在しないツールが LLM から呼び出された場合
   */
  async runWithTools(prompt: string, tools: AgentTool<unknown, unknown>[]): Promise<string> {
    const functionDeclarations: FunctionDeclaration[] = tools.map((tool) => {
      // ZodからJSONSchemaへ変換（zod-to-json-schemaを利用）
      const jsonSchema = zodToJsonSchema(tool.inputSchema, { target: 'openApi3' }) as Record<
        string,
        unknown
      >;

      return {
        name: tool.name,
        description: tool.description,
        parameters: {
          type: SchemaType.OBJECT,
          properties: (jsonSchema.properties as { [k: string]: Schema }) || {},
          required: (jsonSchema.required as string[]) || [],
        },
      };
    });

    // 既存の設定（systemInstruction等）を引き継ぎつつ、toolsパラメータを上書きした一時的なモデルを生成
    let toolsConfig: GeminiTool[] = [{ functionDeclarations }];
    if (this.model.tools && this.model.tools.length > 0) {
      toolsConfig = [...this.model.tools, ...toolsConfig];
    }

    const modelWithTools = this.genAI.getGenerativeModel({
      model: this.model.model,
      systemInstruction: this.model.systemInstruction,
      tools: toolsConfig,
    });

    const chat = modelWithTools.startChat();
    let result = await chat.sendMessage(prompt);

    const MAX_STEPS = 5;
    let stepCount = 0;

    let calls = result.response.functionCalls();
    while (calls && calls.length > 0 && stepCount < MAX_STEPS) {
      stepCount++;
      const functionResponses: Part[] = [];

      for (const call of calls) {
        consola.info(`[BaseAgent] Function Call requested: ${call.name}`);
        const tool = tools.find((t) => t.name === call.name);

        if (!tool) {
          throw new Error(`Tool not found: ${call.name}`);
        }

        try {
          const args = (call.args as Record<string, unknown>) || {};
          const input = tool.inputSchema.parse(args);
          const toolResult = await tool.execute(input);

          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: { result: toolResult },
            },
          });
          consola.success(`[BaseAgent] Tool execution succeeded: ${call.name}`);
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          consola.error(`[BaseAgent] Tool execution failed: ${call.name}`, error);
          functionResponses.push({
            functionResponse: {
              name: call.name,
              response: { error: errorMessage },
            },
          });
        }
      }

      // ツールの実行結果をエージェントへ返却し、次の推論へつなげる
      result = await chat.sendMessage(functionResponses);
      calls = result.response.functionCalls();
    }

    if (stepCount >= MAX_STEPS) {
      consola.warn(`[BaseAgent] Reached maximum tool execution steps (${MAX_STEPS})`);
    }

    return result.response.text();
  }
}
