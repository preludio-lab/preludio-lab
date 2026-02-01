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

  it('640px以下のリクエストで -sm サフィックスを付与すること', () => {
    const result = cloudflareImageLoader({ src: '/images/hero.webp', width: 640 });
    expect(result).toBe(`${baseUrl}/images/hero-sm.webp`);
  });

  it('640pxを超えるリクエストではオリジナルを返すこと', () => {
    const result = cloudflareImageLoader({ src: '/images/hero.webp', width: 1080 });
    expect(result).toBe(`${baseUrl}/images/hero.webp`);
  });

  it('SVGの場合は幅に関わらず常にオリジナルを返すこと', () => {
    const resultSm = cloudflareImageLoader({ src: '/examples/score.svg', width: 300 });
    const resultLg = cloudflareImageLoader({ src: '/examples/score.svg', width: 1200 });

    expect(resultSm).toBe(`${baseUrl}/examples/score.svg`);
    expect(resultLg).toBe(`${baseUrl}/examples/score.svg`);
  });

  it('外部URLの場合はそのまま返すこと', () => {
    const externalUrl = 'https://img.youtube.com/vi/abc/maxresdefault.jpg';
    const result = cloudflareImageLoader({ src: externalUrl, width: 300 });
    expect(result).toBe(externalUrl);
  });

  it('拡張子が異なる場合でも正しくサフィックスを付与すること (jpg)', () => {
    const result = cloudflareImageLoader({ src: 'portrait.jpg', width: 600 });
    expect(result).toBe(`${baseUrl}/portrait-sm.jpg`);
  });

  it('パスの先頭にスラッシュがない場合でも補完すること', () => {
    const result = cloudflareImageLoader({ src: 'articles/thumb.png', width: 1000 });
    expect(result).toBe(`${baseUrl}/articles/thumb.png`);
  });
});
