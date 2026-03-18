import { Noto_Sans_SC, Noto_Serif_SC } from 'next/font/google';

export const notoSansSC = Noto_Sans_SC({
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-sc',
  display: 'swap',
  preload: false,
});

export const notoSerifSC = Noto_Serif_SC({
  weight: ['400', '600', '700'],
  variable: '--font-noto-serif-sc',
  display: 'swap',
  preload: false,
});
