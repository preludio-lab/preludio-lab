import { describe, it, expect } from 'vitest';
import { routing } from './routing';
import { supportedLocales, defaultLocale } from '@/domain/i18n/Locale';

describe('Infrastructure: Routing', () => {
  it('should be configured with domain locales', () => {
    expect(routing.locales).toEqual(supportedLocales);
    expect(routing.defaultLocale).toBe(defaultLocale);
  });

  it('should have always prefix', () => {
    expect(routing.localePrefix).toBe('always');
  });
});
