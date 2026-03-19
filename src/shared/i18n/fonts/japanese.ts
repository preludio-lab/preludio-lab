import { Noto_Sans_JP, Zen_Old_Mincho } from 'next/font/google';

export const notoSansJP = Noto_Sans_JP({
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
  preload: false,
});

export const zenOldMincho = Zen_Old_Mincho({
  weight: ['400', '600', '700'],
  variable: '--font-zen-old-mincho',
  display: 'swap',
  preload: false,
});
