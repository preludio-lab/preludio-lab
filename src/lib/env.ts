import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';
import { APP_ENV, NODE_ENV } from './constants';

export const env = createEnv({
  /**
   * サーバー側でのみ使用可能な環境変数
   */
  server: {
    SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
    NODE_ENV: z
      .enum([NODE_ENV.DEVELOPMENT, NODE_ENV.STAGING, NODE_ENV.PRODUCTION])
      .default(NODE_ENV.DEVELOPMENT),
  },

  /**
   * クライアント側（ブラウザ）に公開される環境変数
   * `NEXT_PUBLIC_` プレフィックスが必須
   */
  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_APP_ENV: z
      .enum([APP_ENV.DEVELOPMENT, APP_ENV.STAGING, APP_ENV.PRODUCTION])
      .default(APP_ENV.DEVELOPMENT),
    NEXT_PUBLIC_CDN_BASE_URL: z.string().url().default('https://cdn.preludiolab.com'),
  },

  /**
   * ランタイム環境変数の参照方法
   * Next.js App Router / Pages Router 両対応のため、process.env を明示的に渡す
   */
  runtimeEnv: {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_CDN_BASE_URL: process.env.NEXT_PUBLIC_CDN_BASE_URL,
  },

  /**
   * 検証に失敗した際の処理
   * CI環境などではビルドを失敗させる
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  emptyStringAsUndefined: true,
});
