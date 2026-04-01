import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { routing } from './shared/i18n/routing';
import { auth } from '@/infrastructure/auth/auth';
import { APP_ENV } from '@/lib/constants';

const intlMiddleware = createMiddleware(routing);

/**
 * Auth + i18n Proxy
 *
 * auth() でラップすることで、authConfig.callbacks.authorized が実行される。
 * その後、第2引数の callback に処理が渡る。
 *
 * 言語判定・リダイレクト・パスの書き換えはすべて next-intl に任せます。
 * これにより、ロケールなしのパス（例: /about）が正しく /en/about へ誘導されます。
 */
export const proxy = auth((req) => {
  // FIXME: next-auth の NextAuthRequest と next-intl が期待する NextRequest の間に、
  // Next.js のマイナーバージョン差異に起因する内部型の不整合があるため、unknown を経由してキャストしています。
  // 将来的にライブラリ側の型定義が更新されたら直接渡せるようになるはずです。
  const response = intlMiddleware(req as unknown as NextRequest);

  // リダイレクト応答の場合: Cache-Control を付与してブラウザによる永続キャッシュを防止し、
  // 後続処理（CSP付与等）をスキップして即座に返す。
  // 背景: next-intl が 308 Permanent Redirect を返すことがあり、ブラウザがこれを
  // プロファイル単位でディスクキャッシュすると、ルーティングロジック変更後に
  // サーバーへリクエストが到達しなくなる致命的な問題が発生する。
  if (response.status >= 300 && response.status < 400) {
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
  }

  const nonce = crypto.randomUUID();
  // SupabaseのURLを許可リストに追加（環境変数から取得できない場合はハードコードかドメイン指定）
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' ${
      process.env.NODE_ENV === APP_ENV.DEVELOPMENT ? "'unsafe-eval'" : ''
    };
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: blob: https://www.youtube.com https://www.youtube-nocookie.com https://img.youtube.com https://i.ytimg.com https://cdn.preludiolab.com;
    font-src 'self' data:;
    connect-src 'self' https://www.google-analytics.com https://raw.githubusercontent.com ${supabaseUrl} https://*.supabase.co;
    frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com;
    media-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://cdn.preludiolab.com;
    worker-src 'self';
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    ${process.env.NODE_ENV !== APP_ENV.DEVELOPMENT ? 'upgrade-insecure-requests;' : ''}
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

  return response;
});

export const config = {
  // API, _next, _vercel, および静的ファイル(拡張子あり: .*\..*)を除外してすべてにマッチさせる
  // Note: この設定により、URLパスに「.」を含むページ（例: /works/op.55）はProxyの対象外となります。
  // そのため、スラグには「.」を使用しない運用（kebab-case）を徹底してください。
  matcher: [
    {
      source: '/((?!api|_next|_vercel|.*\\..*).*)',
      missing: [
        { type: 'header', key: 'next-router-prefetch' },
        { type: 'header', key: 'purpose', value: 'prefetch' },
      ],
    },
  ],
};
