import type { NextAuthConfig } from 'next-auth';
import { adminAuthRepository } from '@/infrastructure/admin';

/**
 * Edge Runtime でも動作可能な認証設定
 * データベースや複雑なライブラリに依存しないロジックのみを定義する
 */
export const authConfig = {
  providers: [], // auth.ts で Google Provider を追加する
  callbacks: {
    /**
     * ルーティングごとの認可チェック
     * Proxy で使用される
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;

      // /admin や /ja/admin, /en/admin などにマッチさせる
      const isAdminPath = /^\/([a-z]{2}\/)?admin/.test(nextUrl.pathname);

      if (isAdminPath) {
        if (isLoggedIn) return true;
        return false; // Redirect to login
      }
      return true;
    },
    /**
     * サインイン時のバリデーション
     * 特定のメールアドレスのみを許可する
     */
    async signIn({ user }) {
      console.log(
        '[Auth Debug] signIn callback executed with user:',
        JSON.stringify(user, null, 2),
      );

      if (!user.email) {
        console.log('[Auth Debug] signIn failed: user.email is missing.');
        return false;
      }

      const role = await adminAuthRepository.getRole(user.email);

      if (role === null) {
        console.log(`[Auth Debug] signIn failed: Role not found for email ${user.email}`);
      }

      // ロール（OWNER または EDITOR）を持っている場合のみサインインを許可
      return role !== null;
    },
    /**
     * セッションにロール情報を付与する
     */
    async session({ session, token }) {
      if (session.user && token.email) {
        const role = await adminAuthRepository.getRole(token.email);

        // Module Augmentation により session.user.role が認識される
        session.user.role = role;
      }
      return session;
    },
  },
  pages: {
    // signIn: '/api/auth/signin', // Default is used
  },
} satisfies NextAuthConfig;
