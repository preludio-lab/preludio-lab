import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  // これは通常、URLの `[locale]` セグメントに対応します
  let locale = await requestLocale;

  // 入力された `locale` パラメータが有効かどうかを検証します
  if (!locale || !(routing.locales as readonly string[]).includes(locale)) {
    locale = routing.defaultLocale;
  }

  if (!locale) {
    return {
      messages: {},
      locale: routing.defaultLocale,
    };
  }
  return {
    messages: (await import(`./messages/${locale}.json`)).default,
    locale: locale,
  };
});
