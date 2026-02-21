import {
  GoogleGenerativeAI,
  GenerativeModel,
  FunctionDeclaration,
  SchemaType,
  Tool as GeminiTool,
} from '@google/generative-ai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { consola } from 'consola';
import { AgentTool } from './tool.js';

export interface AgentConfig {
  /** モデル名 (例: 'gemini-3-flash' | 'gemini-3-pro' 等) */
  modelName: string;
  /** システムプロンプト（ペルソナやルールの定義） */
  systemInstruction?: string;
  /** Google Search を回答の裏付け（Grounding）として利用するかどうか */
  enableGrounding?: boolean;
}

export class BaseAgent {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(config: AgentConfig) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set in environment variables.');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);

    const modelConfig: Record<string, unknown> = {
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
              mode: 'MODE_DYNAMIC',
              dynamicThreshold: 0.3, // 一般的な推奨しきい値
            },
          },
        },
      ];
    }

    this.model = this.genAI.getGenerativeModel(modelConfig);
  }

  /**
   * 単純な構造化出力の生成 (JSON Mode)
   *
   * プロンプトを投げ、Zodスキーマに合致するJSONオブジェクトを生成して返します。
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
   * ツールを使用した対話実行 (Function Calling)
   *
   * エージェントに利用可能なツールを与え、必要に応じて自律的に呼び出させながら最終的な回答を生成します。
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
          properties: (jsonSchema.properties as Record<string, unknown>) || {},
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
      const functionResponses = [];

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
