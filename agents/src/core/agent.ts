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
    // --- 1. 道具の説明書をGemini語（OpenAPI形式）に翻訳する ---
    // GeminiはTypeScriptやZodを直接理解できないため、事前にJSON Schemaに変換して渡します。
    // これによりAIは「自分はこのツールを呼び出せるんだ」と認識します。
    const functionDeclarations: FunctionDeclaration[] = tools.map((tool) => {
      // ZodからJSONSchemaへ自動変換（プロンプトや引数定義の代わりになります）
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

    // --- 2. 「考えて、実行して、報告する」自律ループ ---
    // AIが「もっと情報が必要だ（ツールを使いたい）」と返す限り、最大MAX_STEPSまでループします。
    while (calls && calls.length > 0 && stepCount < MAX_STEPS) {
      stepCount++;
      const functionResponses: Part[] = [];

      for (const call of calls) {
        consola.info(`[BaseAgent] Function Call requested: ${call.name}`);
        // AIが指定してきた名前と同じツールを、登録された道具箱(tools)から探します。
        const tool = tools.find((t) => t.name === call.name);

        // 指定された名前のツールが見つからない場合はエラー
        if (!tool) {
          throw new Error(`Tool not found: ${call.name}`);
        }

        try {
          // --- 3. 型安全な防御壁 (Zodによる解析と実行) ---
          // AIが送ってきた適当かもしれない引数を、Zodで検証し安全な型(`input`)に変換します。
          // 想定外の型や欠損があればここで弾かれエラーになります。
          const args = (call.args as Record<string, unknown>) || {};
          const input = tool.inputSchema.parse(args);

          // 4. 検証を通った安全な引数で、実際のツールの非同期処理を実行します。
          const toolResult = await tool.execute(input);

          // 5. 実行結果をAIへの報告書としてまとめます。
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

      // --- 6. 結果の返却と再考（ループの継続判断） ---
      // ツールの実行結果のリストをAIへ返却（報告）します。
      // AIは結果を見て、「これで十分だから最終回答を作る」か「まだ別のツールが必要」かを判断（再考）します。
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
