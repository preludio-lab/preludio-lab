import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './shared/i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // パスをセグメントに分割 ('/jaa/foo' -> ['', 'jaa', 'foo'])
  const segments = pathname.split('/');
  const firstSegment = segments[1];

  // ルートパス、または有効なロケールの場合は next-intl に任せる
  if (!firstSegment || routing.locales.includes(firstSegment as any)) {
    const response = intlMiddleware(req);

    // UX 向上: スムーズな遷移のために BFcache (Back/Forward Cache) を有効化
    // デフォルトでは Next.js は動的ページに 'no-store' を設定し BFcache を無効にする。
    // これを上書きしてキャッシュを許可しつつ、再検証 ('no-cache') を要求する。
    if (!response.headers.has('Cache-Control')) {
      response.headers.set('Cache-Control', 'private, no-cache, no-transform, must-revalidate');
    }

    return response;
  }

  // 無効なロケール（例: /jaa）の場合、デフォルト言語（en）に置き換えてリダイレクト
  // ユーザー要件: "言語パスに許容しない文字列がある場合、その文字列をデフォルト言語（en）に置き換える"

  // パスの残りの部分を構築 (例: /jaa/works -> /en/works)
  const restOfPath = segments.slice(2).join('/');
  const newPath = `/${routing.defaultLocale}${restOfPath ? `/${restOfPath}` : ''}`;

  const url = req.nextUrl.clone();
  url.pathname = newPath;

  return NextResponse.redirect(url);
}

export const config = {
  // API, _next, _vercel, 静的ファイル(拡張子あり)を除外してすべてにマッチさせる
  // Note: この設定により、URLパスに「.」を含むページ（例: /works/op.55）はミドルウェアの対象外となります。
  // そのため、スラグには「.」を使用しない運用（kebab-case）を徹底してください。
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)'],
};
