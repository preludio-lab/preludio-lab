import { describe, it, expect, vi } from 'vitest';
import cloudflareImageLoader from './cloudflare.image.loader';

// 環境変数のモック
vi.mock('@/lib/env', () => ({
  env: {
    NEXT_PUBLIC_CDN_BASE_URL: 'https://cdn.preludiolab.com',
  },
}));

describe('cloudflareImageLoader', () => {
  const baseUrl = 'https://cdn.preludiolab.com';

  it('CDN相対パス(先頭スラッシュなし)の640px以下のリクエストで -sm とベースURLを付与すること', () => {
    const result = cloudflareImageLoader({ src: 'articles/hero.webp', width: 640 });
    expect(result).toBe(`${baseUrl}/articles/hero-sm.webp`);
  });

  it('CDN相対パスの640pxを超えるリクエストではベースURLのみ付与すること', () => {
    const result = cloudflareImageLoader({ src: 'articles/hero.webp', width: 1080 });
    expect(result).toBe(`${baseUrl}/articles/hero.webp`);
  });

  it('システムのローカル静的UIアセット（先頭スラッシュあり）の場合はそのまま返すこと', () => {
    const result = cloudflareImageLoader({
      src: '/images/placeholders/article-placeholder.webp',
      width: 640,
    });
    expect(result).toBe('/images/placeholders/article-placeholder.webp');
  });

  it('SVGの場合は幅に関わらず -sm サフィックスを付与しないこと', () => {
    const resultSm = cloudflareImageLoader({ src: 'examples/score.svg', width: 300 });
    const resultLg = cloudflareImageLoader({ src: 'examples/score.svg', width: 1200 });

    expect(resultSm).toBe(`${baseUrl}/examples/score.svg`);
    expect(resultLg).toBe(`${baseUrl}/examples/score.svg`);
  });

  it('外部URLの場合はそのまま返すこと', () => {
    const externalUrl = 'https://img.youtube.com/vi/abc/maxresdefault.jpg';
    const result = cloudflareImageLoader({ src: externalUrl, width: 300 });
    expect(result).toBe(externalUrl);
  });

  it('すでにCDNの絶対URLが渡された場合、追加でベースURLを付与せず -sm のみ処理すること', () => {
    const result = cloudflareImageLoader({ src: `${baseUrl}/portrait.jpg`, width: 600 });
    expect(result).toBe(`${baseUrl}/portrait-sm.jpg`);
  });
});
