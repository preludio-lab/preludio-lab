import { defineRouting } from 'next-intl/routing';
import { defaultLocale, supportedLocales } from '@/domain/i18n/locale';

export const routing = defineRouting({
  /** サポートする全ロケールのリスト */
  locales: supportedLocales,

  /** 一致するロケールがない場合に使用されるデフォルト言語 */
  defaultLocale: defaultLocale,

  /** SEOと一貫性のために常にロケールプレフィックスを表示する (`/en/about`, `/ja/about`) */
  localePrefix: 'always',

  /**
   * Cookie configuration for locale persistence
   * HttpOnly is set to true to prevent XSS.
   */
  localeCookie: {
    name: 'NEXT_LOCALE',
    path: '/',
    maxAge: 31536000, // 1 year
    sameSite: 'lax',
    // @ts-expect-error: next-intl types don't include httpOnly but it works at runtime
    httpOnly: true,
    // 本番環境（Vercel Preview/Production）では常に Secure 属性を付与する
    secure: process.env.NODE_ENV === 'production',
  },
});
