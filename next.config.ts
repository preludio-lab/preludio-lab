import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/shared/i18n/config.ts');

// 環境変数からベースURLを取得 (ビルド時に決定)
const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://preludiolab.com');

const nextConfig: NextConfig = {
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  webpack: (config, { dev }) => {
    // 本番ビルド時にコメントを削除 (DAST Alert: Information Disclosure - Suspicious Comments)
    if (!dev && config.optimization.minimizer) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      config.optimization.minimizer.forEach((minimizer: any) => {
        if (minimizer.options?.terserOptions?.format) {
          minimizer.options.terserOptions.format.comments = false;
        }
        if (minimizer.options) {
          minimizer.options.extractComments = false;
        }
      });
    }
    return config;
  },
  images: {
    loader: 'custom',
    loaderFile: './src/infrastructure/storage/cloudflare.image.loader.ts',
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.youtube.com',
      },
      {
        protocol: 'https',
        hostname: 'cdn.preludiolab.com',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8787', // Cloudflare Worker local development
      },
    ],
  },
  // セキュリティ: X-Powered-By ヘッダーを削除してフレームワーク情報の漏洩を防ぐ
  poweredByHeader: false,
  // セキュリティヘッダーの設定 (DAST対策)
  async headers() {
    return [
      {
        // すべてのルートに適用
        source: '/:path*',
        headers: [
          // クリックジャッキング対策: iframe埋め込みを禁止
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          // MIMEスニッフィング対策: Content-Typeを厳格に解釈
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          // XSS対策 (レガシーブラウザ用)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          // Referrer制御: クロスオリジンではオリジンのみ送信
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          // ブラウザ機能の制限: カメラ、マイク、位置情報、FLoCを無効化
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
          },
          // Spectre対策: クロスオリジン分離を強化
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
          // キャッシュ制御 (デフォルト): 動的コンテンツはキャッシュしない (DAST Alert: Non-Storable Content)
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
        ],
      },
      {
        // サイトマップ用 (Middlewareがスキップされるため個別に設定)。パス配下も含む。
        // source: '/sitemap.xml/:path*' は /sitemap.xml/about などにマッチ
        source: '/sitemap.xml/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; style-src 'self'; img-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';",
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        // ルートの sitemap.xml 用 (完全一致)
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Content-Security-Policy',
            value:
              "default-src 'self'; style-src 'self'; img-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none';",
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
      {
        // robots.txt のCORS制限 (Regexでの指定をやめて明示的に分離)
        source: '/robots.txt',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: BASE_URL, // 明示的に制限 (必要に応じて環境変数化)
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'none'; frame-ancestors 'none';",
          },
        ],
      },
      {
        // favicon.ico のCORS制限
        source: '/favicon.ico',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: BASE_URL, // 明示的に制限
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'none'; frame-ancestors 'none';",
          },
        ],
      },
      {
        // 静的アセット用: 長期間キャッシュ＆CORS制限
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          // DAST Alert: Cross-Domain Misconfiguration
          // ワイルドカード許可をやめ、同一オリジンポリシーを推奨する形へ
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-origin',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: 'null', // または特定のオリジン
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
