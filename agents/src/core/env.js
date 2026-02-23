import { z } from 'zod';
import dotenv from 'dotenv';
import { createConsola } from 'consola';
// .env.local を優先して読み込む
dotenv.config({ path: '.env.local' });
// フォールバックとして .env を読み込む
dotenv.config();
/**
 * 環境変数のスキーマ定義
 * Zodを使用して型安全性と必須チェックを行います。
 */
const EnvSchema = z.object({
  /** Gemini APIキー (必須) */
  GEMINI_API_KEY: z.string().min(1, { message: 'GEMINI_API_KEY is required' }),
  /** Turso データベース接続URL (任意) */
  TURSO_DATABASE_URL: z.string().url().optional(),
  /** Turso 認証トークン (任意) */
  TURSO_AUTH_TOKEN: z.string().optional(),
  /** ログレベル (デフォルト: 3=Info) */
  LOG_LEVEL: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default('3'),
});
// プロセス環境変数の検証
const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  const logger = createConsola({ level: 3 });
  logger.error('❌ 環境変数が不正です:', parsed.error.format());
  process.exit(1);
}
/**
 * 型安全な環境変数オブジェクト
 * 起動時に検証済みであることが保証されます。
 */
export const env = parsed.data;
