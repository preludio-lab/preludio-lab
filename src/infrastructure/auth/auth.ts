import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { authConfig } from './auth.config';

/**
 * Node.js ランタイムで使用する認証の実体
 * API Routes や Server Components/Actions で使用される
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
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
