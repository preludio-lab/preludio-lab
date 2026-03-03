import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { authConfig } from './auth.config';
import CredentialsProvider from 'next-auth/providers/credentials';
import { NODE_ENV } from '@/lib/constants';

const isDevAuthBypassEnabled =
  process.env.NODE_ENV === NODE_ENV.DEVELOPMENT && process.env.DEV_AUTH_BYPASS === 'true';

const devProviders = isDevAuthBypassEnabled
  ? [
      CredentialsProvider({
        id: 'dev-bypass',
        name: '開発用認証バイパス',
        credentials: {
          bypass: { label: '開発用ログイン（クリックのみ）', type: 'text', value: 'bypass' },
        },
        async authorize() {
          return {
            id: 'dev-admin-id',
            name: 'Dev Admin',
            email: 'admin@preludiolab.local',
            role: 'OWNER',
          };
        },
      }),
    ]
  : [];

/**
 * Node.js ランタイムで使用する認証の実体
 * API Routes や Server Components/Actions で使用される
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...devProviders,
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
