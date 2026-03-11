import { defineRouting } from 'next-intl/routing';
import { defaultLocale, supportedLocales } from '@/domain/i18n/locale';
import { APP_ENV } from '@/lib/constants';

export const routing = defineRouting({
  /** サポートする全ロケールのリスト */
  locales: supportedLocales,

  /** 一致するロケールがない場合に使用されるデフォルト言語 */
  defaultLocale: defaultLocale,

  /** SEOと一貫性のために常にロケールプレフィックスを表示する (`/en/about`, `/ja/about`) */
  localePrefix: 'always',

  /**
   * Cookie configuration for locale persistence
   * HttpOnly is NOT set to true because client-side navigation needs to read/write it.
   */
  localeCookie: {
    maxAge: 31536000, // 1 year
    sameSite: 'lax',
    secure:
      process.env.NODE_ENV !== APP_ENV.DEVELOPMENT ||
      process.env.VERCEL_ENV === 'preview' ||
      process.env.VERCEL_ENV === 'production',
  },
});
