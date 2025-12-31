import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import {
  Inter,
  Playfair_Display,
  Noto_Sans_JP,
  Zen_Old_Mincho,
  Noto_Sans_SC,
  Noto_Serif_SC,
} from 'next/font/google';

import '../globals.css';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
// 初期バンドルサイズ削減 (TBT改善) のため、プレイヤー機能を厳密に遅延読み込み
// ssr: false での動的インポートを処理するためにClient Componentラッパーを使用
import { DynamicAudioPlayer } from '@/components/player/DynamicAudioPlayer';
import { AudioPlayerProvider } from '@/components/player/AudioPlayerContext';
// 代わりに新しい設定をインポート
import { LazyMotionConfig } from '@/components/ui/LazyMotionConfig';
import { ConsentBanner } from '@/components/layout/ConsentBanner';
import { Toaster } from 'react-hot-toast';
import { supportedLocales, AppLocale } from '@/domain/i18n/Locale';

// フォント設定
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const notoSansJP = Noto_Sans_JP({
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
  preload: false,
});

const zenOldMincho = Zen_Old_Mincho({
  weight: ['400', '600', '700'],
  variable: '--font-zen-old-mincho',
  display: 'swap',
  preload: false,
});

const notoSansSC = Noto_Sans_SC({
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-sc',
  display: 'swap',
  preload: false,
});

const notoSerifSC = Noto_Serif_SC({
  weight: ['400', '600', '700'],
  variable: '--font-noto-serif-sc',
  display: 'swap',
  preload: false,
});

import { BASE_URL } from '@/lib/constants';

type Props = {
  children: React.ReactNode;
  params: Promise<{ lang: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { lang } = await params;
  const t = await getTranslations({ locale: lang, namespace: 'Metadata' });

  // サポートされている全ロケールのalternatesを動的に生成
  const languages: Record<string, string> = {};
  supportedLocales.forEach((locale) => {
    languages[locale] = `/${locale}`;
  });
  // x-defaultはグローバルSEOに必須であり、英語版を指すように設定
  languages['x-default'] = '/en';

  return {
    title: t('title'),
    description: t('description'),
    metadataBase: new URL(BASE_URL),
    alternates: {
      canonical: `/${lang}`,
      languages,
    },
  };
}

// 静的生成（SSG）のためのパラメータを明示的に定義
export async function generateStaticParams() {
  return supportedLocales.map((lang) => ({ lang }));
}

export default async function RootLayout({ children, params }: Props) {
  const { lang } = await params;
  const messages = await getMessages();

  // 言語に基づいてフォント変数とベースクラスを決定
  // 最適化: 必要な言語のフォント変数のみを注入し、不要なフォントのプリロードを防ぐ
  let fontVariables = `${inter.variable} ${playfair.variable}`;
  let baseFontClass = 'font-sans-en text-primary bg-paper';

  if (lang === AppLocale.JA) {
    // 日本語: Noto Sans JP + Zen Old Mincho
    fontVariables += ` ${notoSansJP.variable} ${zenOldMincho.variable}`;
    baseFontClass = 'font-sans-ja text-primary bg-paper';
  } else if (lang === AppLocale.ZH) {
    // 中国語: Noto Sans SC + Noto Serif SC
    fontVariables += ` ${notoSansSC.variable} ${notoSerifSC.variable}`;
    baseFontClass = 'font-sans-zh text-primary bg-paper';
  } else {
    // その他 (欧文): 追加フォントなし (Inter/Playfairのみ)
  }

  return (
    <html lang={lang} className={fontVariables} suppressHydrationWarning>
      <body className={`${baseFontClass} antialiased`}>
        <NextIntlClientProvider messages={messages}>
          <AudioPlayerProvider>
            <LazyMotionConfig>
              <Header lang={lang} />
              <main className="min-h-screen pb-24">{children}</main>
              <Footer />

              {/* グローバルオーディオプレイヤー (遅延読み込み) */}
              <DynamicAudioPlayer />

              <ConsentBanner />
              <Toaster position="bottom-right" />
            </LazyMotionConfig>
          </AudioPlayerProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
