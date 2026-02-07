import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './shared/i18n/routing';
import { auth } from '@/infrastructure/auth/auth';

const intlMiddleware = createMiddleware(routing);

/**
 * Auth + i18n Middleware
 *
 * auth() でラップすることで、authConfig.callbacks.authorized が実行される。
 * その後、第2引数の callback に処理が渡る。
 */
export default auth((req) => {
  const { pathname } = req.nextUrl;

  // パスをセグメントに分割 ('/jaa/foo' -> ['', 'jaa', 'foo'])
  const segments = pathname.split('/');
  const firstSegment = segments[1];

  if (!firstSegment || (routing.locales as readonly string[]).includes(firstSegment)) {
    // FIXME: next-auth の NextAuthRequest と next-intl が期待する NextRequest の間に、
    // Next.js のマイナーバージョン差異に起因する内部型の不整合があるため、unknown を経由してキャストしています。
    // 将来的にライブラリ側の型定義が更新されたら直接渡せるようになるはずです。
    const response = intlMiddleware(req as unknown as NextRequest);

    // UX 向上: スムーズな遷移のために BFcache (Back/Forward Cache) を有効化
    if (!response.headers.has('Cache-Control')) {
      response.headers.set('Cache-Control', 'private, no-cache, no-transform, must-revalidate');
    }

    return response;
  }

  // 無効なロケールのリダイレクト処理
  const restOfPath = segments.slice(2).join('/');
  const newPath = `/${routing.defaultLocale}${restOfPath ? `/${restOfPath}` : ''}`;

  const url = req.nextUrl.clone();
  url.pathname = newPath;
  return NextResponse.redirect(url);
});

export const config = {
  // API, _next, _vercel, 静的ファイルを除外してすべてにマッチさせる
  matcher: ['/((?!api|_next|_vercel|favicon.ico|sitemap.xml|robots.txt|.*\\..*).*)'],
};
