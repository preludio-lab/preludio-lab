/**
 * Zod 4 スキーマを JSON Schema に変換するための型安全なラッパー
 *
 * zod-to-json-schema (v3.25.x) は内部で zod/v3 互換レイヤーの ZodSchema<any> を
 * 型引数として要求します。Zod 4 の ZodType とは型階層が異なるため、
 * 直接渡すと型エラーが発生します。
 *
 * このラッパーは、型変換を一箇所に集約し、呼び出し側での as any を排除します。
 * ランタイムでは Zod 4 のスキーマが zod-to-json-schema に問題なく変換されることを確認済みです。
 */

import { ZodSchema } from 'zod/v3';
import { zodToJsonSchema, type Options, type Targets } from 'zod-to-json-schema';
import { z } from 'zod';

/**
 * Zod 4 のスキーマを JSON Schema (OpenAPI 3.0 形式) に変換します。
 *
 * @param schema Zod 4 のスキーマオブジェクト
 * @param options zod-to-json-schema のオプション（デフォルト: OpenAPI 3.0 ターゲット）
 * @returns JSON Schema オブジェクト
 */
export function convertZodToJsonSchema<Target extends Targets = 'openApi3'>(
  schema: z.ZodType<unknown>,
  options?: Partial<Options<Target>>,
): Record<string, unknown> {
  // Zod 4 は zod/v3 互換レイヤーを提供しており、ランタイムでは正常に動作する。
  // 型レベルでのみ不整合があるため、zod/v3 の ZodSchema 型にキャストする。
  const v3CompatSchema = schema as unknown as ZodSchema;
  const mergedOptions = { target: 'openApi3' as Target, ...options };
  return zodToJsonSchema(v3CompatSchema, mergedOptions) as Record<string, unknown>;
}
