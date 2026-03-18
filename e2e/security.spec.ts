import { expect, test } from '@playwright/test';

/**
 * Security Compliance Tests
 *
 * This test suite verifies that critical security headers and cookie attributes
 * are correctly set in the environment.
 */
test.describe('Security Compliance', () => {
  test.describe('Cookie Attributes', () => {
    test('NEXT_LOCALE should be HttpOnly and Secure (in prod)', async ({ page }) => {
      // Navigate to home page (this should trigger the locale cookie setup via middleware)
      await page.goto('/');

      // Wait for network idle to ensure middleware and any client-side hydration is done
      await page.waitForLoadState('networkidle');

      let cookies = await page.context().cookies();
      let targetCookie = cookies.find((c) => c.name === 'NEXT_LOCALE');

      // Note: In some Environments (like Preview or clean sessions),
      // the cookie might not be set until a locale-prefixed path is visited or a switch occurs.
      if (!targetCookie) {
        await page.goto('/ja');
        await page.waitForLoadState('networkidle');
        cookies = await page.context().cookies();
        targetCookie = cookies.find((c) => c.name === 'NEXT_LOCALE');
      }

      expect(targetCookie, 'NEXT_LOCALE cookie should exist').toBeDefined();

      // Rationale: We decided NEXT_LOCALE must be HttpOnly to prevent XSS.
      // We use @ts-expect-error in routing.ts to enforce this.
      expect(targetCookie?.httpOnly, 'Cookie should be HttpOnly').toBe(true);

      // Secure attribute should be true in production-like environments
      const isProd =
        process.env.PLAYWRIGHT_TEST_BASE_URL?.includes('vercel.app') ||
        process.env.NODE_ENV === 'production';
      if (isProd) {
        expect(targetCookie?.secure, 'Cookie should be Secure in production').toBe(true);
      }
    });

    test('Auth.js CSRF token should be Secure in production', async ({ page }) => {
      await page.goto('/');
      const cookies = await page.context().cookies();

      // Auth.js (NextAuth) usually uses __Host-authjs.csrf-token or similar in prod
      const csrfCookie = cookies.find((c) => c.name.includes('csrf-token'));

      const isProd =
        process.env.PLAYWRIGHT_TEST_BASE_URL?.includes('vercel.app') ||
        process.env.NODE_ENV === 'production';
      if (isProd && csrfCookie) {
        expect(csrfCookie.secure, 'CSRF token should be Secure in production').toBe(true);
      }
    });
  });
});
