import fs from 'node:fs';
import path from 'node:path';
import { z } from 'zod';
import { AgentTool, ToolContext } from '@/core/tool.js';
import { consola } from 'consola';
import { prune } from '@/shared/utils/json.js';

/**
 * AIエージェントが生成したデータ（マスタデータ等）を、直接DBに書き込む前に
 * ファイルシステム（Gitリポジトリの `data/` ディレクトリ等）へJSONとして保存するツール。
 *
 * 指定されたZodスキーマに従ってデータを検証し、管理用メタデータを自動付与して保存します。
 */
export class AgentDataWriterTool<T extends z.ZodRawShape> implements AgentTool<
  z.infer<z.ZodObject<T>>,
  string
> {
  public name: string;
  public description: string;
  public inputSchema: z.ZodObject<T>;

  private outputDir: string;
  private slugField: keyof z.infer<z.ZodObject<T>>;
  private usePrune: boolean;

  /**
   * @param name ツールの識別名（例: `composerDataWriter`）
   * @param description ツールの説明文
   * @param schema 保存対象データのZodスキーマ（例: `ComposerMasterSchema`）
   * @param outputDir 保存先ディレクトリの相対または絶対パス（例: `data/composers`）
   * @param slugField ファイル名（`[slug].json`）として使用するフィールド名。デフォルトは `'slug'`。
   * @param options 追加オプション
   * @param options.prune 保存前に空のフィールドを自動的に削除するかどうか。デフォルトは `true`。
   */
  constructor(
    name: string,
    description: string,
    schema: z.ZodObject<T>,
    outputDir: string,
    slugField: keyof z.infer<z.ZodObject<T>>,
    options: { prune?: boolean } = {},
  ) {
    this.name = name;
    this.description = description;
    this.inputSchema = schema;
    this.outputDir = path.isAbsolute(outputDir)
      ? outputDir
      : path.resolve(process.cwd(), outputDir);
    this.slugField = slugField;
    this.usePrune = options.prune !== false;

    // 出力先ディレクトリが存在しない場合は作成
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * 指定されたデータを検証・メタデータを付与し、ローカルのJSONファイルとして書き出します。
   *
   * @param input Zodスキーマで検証された入力値
   * @param context 実行時のコンテキスト情報（呼び出し元のモデル名など）
   * @returns 保存されたファイルの絶対パス
   */
  async execute(input: z.infer<z.ZodObject<T>>, context?: ToolContext): Promise<string> {
    // 1. 公開データに含めてはいけない内部メタデータの除去 (_reasoning)
    const { _reasoning: _, ...cleanInput } = input as Record<string, unknown>;

    // 2. 正規化 (prune) の実行
    const targetData = this.usePrune ? (prune(cleanInput) as Record<string, unknown>) : cleanInput;

    // 3. スキーマによる再検証 (保存直前の最終ガード)
    const validatedData = this.inputSchema.parse(targetData);

    // 4. スラグ（ファイル名）の取得
    const slug = String(validatedData[this.slugField as keyof typeof validatedData]);
    if (!slug) {
      throw new Error(
        `[AgentDataWriterTool] The input data does not contain the required slug field: ${String(this.slugField)}`,
      );
    }

    const filePath = path.join(this.outputDir, `${slug}.json`);

    // 5. システムメタデータの生成 (既存のものを優先)
    const existingMeta = (validatedData as Record<string, unknown>)._generatorMeta as
      | Record<string, unknown>
      | undefined;

    const metaData = {
      _generatorMeta: {
        model: existingMeta?.model || context?.modelName || 'AgentSystem',
        generatedAt: existingMeta?.generatedAt || new Date().toISOString(),
      },
    };

    // 6. 最終データの結合
    const finalData = {
      ...validatedData,
      ...metaData,
    };

    try {
      // 整形してJSONとして書き出し
      fs.writeFileSync(filePath, JSON.stringify(finalData, null, 2), 'utf-8');
      consola.success(`[AgentDataWriterTool] Successfully wrote data to: ${filePath}`);
      return filePath;
    } catch (error) {
      consola.error(`[AgentDataWriterTool] Failed to write data to ${filePath}`, error);
      throw error;
    }
  }
}
