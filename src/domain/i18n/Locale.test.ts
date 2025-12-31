import { describe, it, expect } from 'vitest';
import { AppLocale, supportedLocales, defaultLocale } from './Locale';

describe('Domain: Locale', () => {
  it('should have correct default locale', () => {
    expect(defaultLocale).toBe('en');
  });

  it('should support EN and JA', () => {
    expect(supportedLocales).toContain(AppLocale.EN);
    expect(supportedLocales).toContain(AppLocale.JA);
    // Expect at least English and Japanese, but allow more
    expect(supportedLocales.length).toBeGreaterThanOrEqual(2);
  });

  it('should have immutable constants', () => {
    expect(AppLocale.EN).toBe('en');
    expect(AppLocale.JA).toBe('ja');
  });
});
