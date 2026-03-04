/**
 * Zod スキーマを JSON Schema に変換するための型安全なラッパー
 */

import { zodToJsonSchema, type Options, type Targets } from 'zod-to-json-schema';
import { type ZodType } from 'zod';

/**
 * Zod のスキーマを JSON Schema (OpenAPI 3.0 形式) に変換します。
 *
 * @param schema Zod のスキーマオブジェクト
 * @param options zod-to-json-schema のオプション（デフォルト: OpenAPI 3.0 ターゲット）
 * @returns JSON Schema オブジェクト
 */
export function convertZodToJsonSchema<Target extends Targets = 'openApi3'>(
  schema: ZodType<unknown>,
  options?: Partial<Options<Target>>,
): Record<string, unknown> {
  const mergedOptions = { target: 'openApi3' as Target, ...options };
  return zodToJsonSchema(schema, mergedOptions) as Record<string, unknown>;
}
