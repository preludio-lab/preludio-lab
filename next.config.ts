import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/shared/i18n/config.ts');

const nextConfig: NextConfig = {
  serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error'] } : false,
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
          // Content Security Policy (Report-Onlyモード)
          // 段階的導入: まず違反を監視し、問題がなければEnforceモードに移行
          {
            key: 'Content-Security-Policy-Report-Only',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.youtube.com https://www.youtube-nocookie.com https://www.google-analytics.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https: blob:",
              "font-src 'self' data:",
              "connect-src 'self' https://www.google-analytics.com",
              "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
              "media-src 'self' https:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              'upgrade-insecure-requests',
            ].join('; '),
          },
        ],
      },
      {
        // 静的アセット用: CDNからのアクセスを許可
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'cross-origin',
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
