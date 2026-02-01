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
};

export default withNextIntl(nextConfig);
