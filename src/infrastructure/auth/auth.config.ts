import type { NextAuthConfig } from 'next-auth';
import { adminAuthRepository } from '@/infrastructure/admin';
import { serverLogger as logger } from '@/infrastructure/logging/server.logger';
import { NODE_ENV } from '@/lib/constants';

const isDevAuthBypassEnabled =
  process.env.NODE_ENV === NODE_ENV.DEVELOPMENT && process.env.DEV_AUTH_BYPASS === 'true';

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
      const pathname = nextUrl.pathname;

      // /admin や /ja/admin, /en/admin などにマッチさせる
      const isAdminPath = /^\/([a-z]{2}\/)?admin/.test(pathname);
      // loginページは保護対象から除外する
      const isLoginPath = /^\/([a-z]{2}\/)?admin\/login\/?$/.test(pathname);

      if (isAdminPath && !isLoginPath) {
        if (isLoggedIn) return true;

        // 未承認の場合: false を返すと pages.signIn (/admin/login) へリダイレクトされる
        // i18n のリダイレクトは next-intl ミドルウェアが後段で処理する
        return false;
      }
      return true;
    },
    // redirectコールバックにあった複雑な条件は不要になったため削除（デフォルトの動作に任せる）

    async signIn({ user }) {
      logger.debug('signIn callback executed', { user: JSON.stringify(user, null, 2) });

      if (!user.email) {
        logger.debug('signIn failed: user.email is missing.');
        return false;
      }

      // 【フェイルセーフ】開発時のダミーユーザーであれば無条件で許可
      if (isDevAuthBypassEnabled && user.email === 'admin@preludiolab.local') {
        return true;
      }

      const role = await adminAuthRepository.getRole(user.email);

      if (role === null) {
        logger.debug(`signIn failed: Role not found for email ${user.email}`);
      }

      // ロール（OWNER または EDITOR）を持っている場合のみサインインを許可
      return role !== null;
    },
    /**
     * セッションにロール情報を付与する
     */
    async session({ session, token }) {
      if (session.user && token.email) {
        // 開発環境用のバイパスユーザーの場合
        if (isDevAuthBypassEnabled && token.email === 'admin@preludiolab.local') {
          session.user.role = 'OWNER';
          // UI側でバッジ表示を行うためのフラグを含める
          (session.user as { isDevBypass?: boolean }).isDevBypass = true;
          return session;
        }

        const role = await adminAuthRepository.getRole(token.email);

        // Module Augmentation により session.user.role が認識される
        session.user.role = role;
      }
      return session;
    },
  },
  pages: {
    // 抽象化されたログインパスを指定。ロケールの付与は next-intl (proxy.ts) に任せる
    signIn: '/admin/login',
  },
} satisfies NextAuthConfig;
