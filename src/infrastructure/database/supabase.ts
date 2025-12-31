import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';
import { Database } from './database.types';

/**
 * 標準の Supabase クライアント (Singleton)
 *
 * 役割: ブラウザおよびサーバーでの一般的なデータ操作用。
 * セキュリティ: Anon Key を使用し、常に RLS (Row Level Security) の制約を受けます。
 */
export const supabase = createClient<Database>(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
