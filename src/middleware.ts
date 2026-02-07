import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { routing } from './shared/i18n/routing';
import { auth } from '@/infrastructure/auth/auth';

const intlMiddleware = createMiddleware(routing);

/**
 * Auth + i18n Middleware
 *
 * auth() でラップすることで、authConfig.callbacks.authorized が実行される。
 * その後、第2引数の callback に処理が渡る。
 *
 * 言語判定・リダイレクト・パスの書き換えはすべて next-intl に任せます。
 * これにより、ロケールなしのパス（例: /about）が正しく /en/about へ誘導されます。
 */
export default auth((req) => {
  // FIXME: next-auth の NextAuthRequest と next-intl が期待する NextRequest の間に、
  // Next.js のマイナーバージョン差異に起因する内部型の不整合があるため、unknown を経由してキャストしています。
  // 将来的にライブラリ側の型定義が更新されたら直接渡せるようになるはずです。
  const response = intlMiddleware(req as unknown as NextRequest);

  // UX 向上: スムーズな遷移のために BFcache (Back/Forward Cache) を有効化
  // (リダイレクト時は除外するため、ステータスコードを確認)
  if (response.status === 200 && !response.headers.has('Cache-Control')) {
    response.headers.set('Cache-Control', 'private, no-cache, no-transform, must-revalidate');
  }

  return response;
});

export const config = {
  // API, _next, _vercel, 静的ファイルを除外してすべてにマッチさせる
  matcher: ['/((?!api|_next|_vercel|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)'],
};
