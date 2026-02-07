import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { authConfig } from './auth.config';

/**
 * Node.js ランタイムで使用する認証の実体
 * API Routes や Server Components/Actions で使用される
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID,
      clientSecret: process.env.AUTH_GITHUB_SECRET,
    }),
  ],
});

/**
 * ログアウトのための Server Action
 * UIコンポーネントが Auth.js に直接依存するのを防ぐ
 */
export async function signOutAction() {
  await signOut({ redirectTo: '/' });
}
