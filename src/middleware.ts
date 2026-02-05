import createMiddleware from 'next-intl/middleware';
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

  // ルートパス、または有効なロケールの場合は next-intl に任せる
  if (!firstSegment || (routing.locales as readonly string[]).includes(firstSegment)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = intlMiddleware(req as any);

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
  return Response.redirect(url);
});

export const config = {
  // API, _next, _vercel, 静的ファイル(拡張子あり)を除外してすべてにマッチさせる
  // Note: この設定により、URLパスに「.」を含むページ（例: /works/op.55）はミドルウェアの対象外となります。
  // そのため、スラグには「.」を使用しない運用（kebab-case）を徹底してください。
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
