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
  Content,
} from '@google/generative-ai';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { consola } from 'consola';
import { AgentTool } from './tool.js';
import { GeminiModelName, Message } from './models.js';
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
    // APIキーが未設定の場合はエラーを投げて初期化を中断する
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not set.');
    }

    this.genAI = new GoogleGenerativeAI(apiKey);

    const modelConfig: ModelParams = {
      model: config.modelName,
    };

    // システムプロンプト（役割定義など）が指定されている場合は設定に反映
    if (config.systemInstruction) {
      modelConfig.systemInstruction = config.systemInstruction;
    }

    // Google検索による回答の裏付け（Grounding）が有効な場合の設定
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
    // Zod スキーマを Gemini が理解できる JSON スキーマ（OpenAPI 3形式）に変換
    const jsonSchema = zodToJsonSchema(schema, { target: 'openApi3' }) as Record<string, unknown>;

    const result = await this.model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        // Gemini 側にスキーマを渡すことで、出力構造を物理的に強制（Constrained Output）する
        responseSchema: {
          type: SchemaType.OBJECT,
          properties: (jsonSchema.properties as { [k: string]: Schema }) || {},
          required: (jsonSchema.required as string[]) || [],
        },
      },
    });

    const responseText = result.response.text();
    try {
      // モデルが強制に従った出力を返してくるため、JSON パースと Zod 検証は極めて高い確率で成功する
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
   * @param messages コンテキスト（会話履歴）を表す Message 配列
   * @param tools このスレッド内でエージェントが利用できる `AgentTool` インターフェースを実装したツールの配列
   * @returns ツール実行の結果を踏まえて生成された、エージェントからの最終的なテキスト回答
   * @throws {Error} 存在しないツールが LLM から呼び出された場合、またはメッセージリストが空の場合
   */
  async runWithTools(messages: Message[], tools: AgentTool<unknown, unknown>[]): Promise<string> {
    // 実行には少なくとも1つのユーザーメッセージが必要
    if (messages.length === 0) {
      throw new Error('Messages array cannot be empty.');
    }
    // --- 1. ツール定義をモデルが解釈可能な形式 (OpenAPI Schema) に変換する ---
    // Gemini SDKはZodオブジェクトを直接扱えないため、事前に互換性のあるJSON Schemaヘ変換します。
    const functionDeclarations: FunctionDeclaration[] = tools.map((tool) => {
      // ZodスキーマからJSON Schema (OpenAPI 3) ヘの自動変換を行い、引数仕様を定義します。
      const jsonSchema = zodToJsonSchema(tool.inputSchema, { target: 'openApi3' }) as Record<
        string,
        unknown
      >;

      return {
        name: tool.name, // AIが呼び出す関数名
        description: tool.description, // 何をする関数か、いつ使うべきかの説明
        parameters: {
          type: SchemaType.OBJECT,
          properties: (jsonSchema.properties as { [k: string]: Schema }) || {},
          required: (jsonSchema.required as string[]) || [], // 必須パラメータの指定
        },
      };
    });

    // 既存の設定（systemInstruction等）を引き継ぎつつ、toolsパラメータを上書きした一時的なモデルを生成
    let toolsConfig: GeminiTool[] = [{ functionDeclarations }];
    // 既に設定されているツール（Grounding等）がある場合は、それらとマージする
    if (this.model.tools && this.model.tools.length > 0) {
      toolsConfig = [...this.model.tools, ...toolsConfig];
    }

    const modelWithTools = this.genAI.getGenerativeModel({
      model: this.model.model,
      systemInstruction: this.model.systemInstruction,
      tools: toolsConfig,
    });

    // メッセージ配列から Gemini の Content 形式へ変換（最後のユーザーメッセージは sendMessage に渡すためポップする）
    const history: Content[] = messages.slice(0, -1).map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));

    const ObjectMessage = messages[messages.length - 1];
    const lastMessage = ObjectMessage!; // length === 0 check is already done above

    // 履歴付きでチャットセッションを開始
    const chat = modelWithTools.startChat({ history });
    let result = await chat.sendMessage(lastMessage.content);

    const MAX_STEPS = 5;
    let stepCount = 0;

    let calls = result.response.functionCalls();

    // --- 2. 推論、ツール実行、および結果解析の自律的な反復処理 ---
    // モデルがツール実行を要求（Function Call）する限り、指定された最大ステップ数まで継続します。
    while (calls && calls.length > 0 && stepCount < MAX_STEPS) {
      stepCount++;
      const functionResponses: Part[] = [];

      for (const call of calls) {
        consola.info(`[BaseAgent] Function Call requested: ${call.name}`);
        // 要求されたツール名に合致する実装を、登録されたツールリストから取得します。
        const tool = tools.find((t) => t.name === call.name);

        // 指定された名前のツールが見つからない場合はエラー
        if (!tool) {
          throw new Error(`Tool not found: ${call.name}`);
        }

        try {
          // --- 3. 型安全性に基づく引数のバリデーションと実行 ---
          // モデルから渡された動的な引数をZodスキーマに照らして検証し、型確定済みのオブジェクトに変換します。
          // スキーマに適合しない場合は例外をスローし、不正な実行を防止します。
          const args = (call.args as Record<string, unknown>) || {};
          const input = tool.inputSchema.parse(args);

          // 4. 検証済み引数を用いてツールの実体処理（非同期）を実行します。
          const toolResult = await tool.execute(input);

          // 5. 実行結果をモデルへのレスポンス形式に成形します。
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

      // --- 6. 実行結果のフィードバックと後続推論の継続判断 ---
      // ツールの実行結果をモデルに返却し、後続の回答生成または追加のツール実行が必要かを判断させます。
      result = await chat.sendMessage(functionResponses);
      calls = result.response.functionCalls();
    }

    // 最大ループ回数に達した場合は、無限ループ防止のため警告を出す
    if (stepCount >= MAX_STEPS) {
      consola.warn(`[BaseAgent] Reached maximum tool execution steps (${MAX_STEPS})`);
    }

    return result.response.text();
  }
}
