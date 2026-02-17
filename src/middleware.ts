import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { routing } from './shared/i18n/routing';
import { auth } from '@/infrastructure/auth/auth';
import { APP_ENV } from '@/lib/constants';

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

  const nonce = crypto.randomUUID();
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${
      process.env.NODE_ENV === APP_ENV.DEVELOPMENT ? "'unsafe-eval'" : ''
    };
    style-src 'self' 'nonce-${nonce}' ${
      process.env.NODE_ENV === APP_ENV.DEVELOPMENT ? "'unsafe-inline'" : ''
    };
    img-src 'self' data: blob: https://www.youtube.com https://www.youtube-nocookie.com https://img.youtube.com https://cdn.preludiolab.com;
    font-src 'self' data:;
    connect-src 'self' https://www.google-analytics.com;
    frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com;
    media-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://cdn.preludiolab.com;
    worker-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `
    .replace(/\s{2,}/g, ' ')
    .trim();

  // UX 向上: スムーズな遷移のために BFcache (Back/Forward Cache) を有効化
  // (リダイレクト時は除外するため、ステータスコードを確認)
  if (response.status === 200 && !response.headers.has('Cache-Control')) {
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
});

export const config = {
  // API, _next, _vercel, 静的ファイル(拡張子あり)を除外してすべてにマッチさせる
  // Note: この設定により、URLパスに「.」を含むページ（例: /works/op.55）はミドルウェアの対象外となります。
  // そのため、スラグには「.」を使用しない運用（kebab-case）を徹底してください。
  matcher: [
    {
      source:
        '/((?!api|_next/static|_next/image|_vercel|favicon.ico|sitemap.xml|robots.txt|articles).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
