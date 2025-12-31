import { defineRouting } from 'next-intl/routing';
import { defaultLocale, supportedLocales } from '@/domain/i18n/Locale';

export const routing = defineRouting({
  /** サポートする全ロケールのリスト */
  locales: supportedLocales,

  /** 一致するロケールがない場合に使用されるデフォルト言語 */
  defaultLocale: defaultLocale,

  /** SEOと一貫性のために常にロケールプレフィックスを表示する (`/en/about`, `/ja/about`) */
  localePrefix: 'always',
});
