import 'server-only';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';
import { Database } from './database.types';
import { logger } from '@/infrastructure/logging';

/**
 * 管理者権限を持つ Supabase クライアント (Singleton)
 *
 * 役割: サーバーサイドでのバッチ処理、データ同期、システム管理用。
 * セキュリティ:
 *   1. 'server-only' パッケージにより、クライアントサイドでのビルドを防止（物理的隔離）。
 *   2. Service Role Key を使用し、RLS をバイパスします。
 *   3. 実行時のブラウザチェックにより、万が一の誤実行を防止。
 *
 * @throws {Error} サーバーサイド環境以外で呼び出された場合、または環境変数が不足している場合。
 */
let adminClient: SupabaseClient<Database> | null = null;
// logger は中央エントリポイントから提供されるインスタンスを使用します。

export const getSupabaseAdmin = (): SupabaseClient<Database> => {
  // 1. ランタイムチェック: ブラウザ側での実行を即座にブロック
  if (typeof window !== 'undefined') {
    const error = new Error(
      'Critical Security Error: getSupabaseAdmin must only be called on the server.',
    );
    logger.error(error.message, error);
    throw error;
  }

  // 2. シングルトンの返却
  if (adminClient) return adminClient;

  try {
    const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

    // 3. 環境変数チェック
    if (!serviceRoleKey) {
      throw new Error(
        'SUPABASE_SERVICE_ROLE_KEY is required for admin operations. Check your server environment variables.',
      );
    }

    // 4. クライアント生成
    logger.info('Initializing Supabase Admin Client (Singleton)');

    adminClient = createClient<Database>(env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    return adminClient;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    logger.error('Failed to initialize Supabase Admin Client', error, {
      context: 'Infrastructure:Supabase:getSupabaseAdmin',
    });
    throw error;
  }
};
