import { handlers } from '@/infrastructure/auth/auth';

/**
 * Auth.js (NextAuth) API Route Handler
 *
 * /api/auth/* へのリクエストを処理する
 */
export const { GET, POST } = handlers;
