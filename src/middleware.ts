import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { routing } from './shared/i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const nonce = crypto.randomUUID();
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: http: ${
      process.env.NODE_ENV === 'production' ? '' : "'unsafe-eval'"
    };
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https://www.youtube.com https://www.youtube-nocookie.com https://img.youtube.com https://cdn.preludiolab.com;
    font-src 'self' data:;
    connect-src 'self' https://www.google-analytics.com;
    frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com;
    media-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://cdn.preludiolab.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, ' ')
    .trim();

  // パスをセグメントに分割 ('/jaa/foo' -> ['', 'jaa', 'foo'])
  const segments = pathname.split('/');
  const firstSegment = segments[1];

  // ルートパス、または有効なロケールの場合は next-intl に任せる
  if (!firstSegment || (routing.locales as readonly string[]).includes(firstSegment)) {
    const response = intlMiddleware(req);

    // UX 向上: スムーズな遷移のために BFcache (Back/Forward Cache) を有効化
    // デフォルトでは Next.js は動的ページに 'no-store' を設定し BFcache を無効にする。
    // これを上書きしてキャッシュを許可しつつ、再検証 ('no-cache') を要求する。
    if (!response.headers.has('Cache-Control')) {
      response.headers.set('Cache-Control', 'private, no-cache, no-transform, must-revalidate');
    }

    // セキュリティ強化: CSPヘッダーを設定
    response.headers.set('Content-Security-Policy', cspHeader);
    // Nonceをリクエストヘッダーにセット（Server Componentsで取得するため）
    response.headers.set('x-nonce', nonce);

    // セキュリティ強化: NEXT_LOCALE Cookieに HttpOnly と Secure フラグを追加
    const locale = response.cookies.get('NEXT_LOCALE')?.value;
    if (locale) {
      response.cookies.set('NEXT_LOCALE', locale, {
        httpOnly: true, // JavaScript からのアクセスを防ぐ (DAST Alert ID: 10010)
        secure: process.env.NODE_ENV === 'production', // HTTPS 接続のみで送信 (DAST Alert ID: 10011)
        sameSite: 'lax', // CSRF 対策
        maxAge: 31536000, // 1年
        path: '/',
      });
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
  matcher: [
    {
      source: '/((?!api|_next/static|_next/image|_vercel|favicon.ico|sitemap.xml|robots.txt).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
