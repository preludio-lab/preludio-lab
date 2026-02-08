import { defineConfig, devices } from '@playwright/test';

/**
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? 'list' : 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:3000',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',

    /* Vercel Deployment Protection Bypass */
    extraHTTPHeaders: {
      'x-vercel-protection-bypass': process.env.VERCEL_AUTOMATION_BYPASS_SECRET || '',
    },
  },

  /* Run your local dev server before starting the tests */
  // Vercel Preview 等の外部 URL をテストする場合は、ローカルサーバーの起動をスキップする
  webServer: process.env.PLAYWRIGHT_TEST_BASE_URL
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
        env: {
          SKIP_ENV_VALIDATION: 'true',
          NEXT_PUBLIC_APP_ENV: 'development',
          // Auth.js 起動用 (32文字以上の文字列)
          AUTH_SECRET: 'dummy_secret_for_e2e_testing_purposes_only_32_chars',
          // ダミーインフラ設定
          NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
          NEXT_PUBLIC_SUPABASE_ANON_KEY: 'dummy-key',
          TURSO_DATABASE_URL: 'file:local-e2e.db',
          R2_ENDPOINT: 'http://localhost:20000',
          R2_ACCESS_KEY_ID: 'dummy-id',
          R2_SECRET_ACCESS_KEY: 'dummy-secret',
        },
      },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // CI環境ではスモールスタートとしてChromiumのみ実行
    ...(process.env.CI
      ? []
      : [
          {
            name: 'firefox',
            use: { ...devices['Desktop Firefox'] },
          },
          {
            name: 'webkit',
            use: { ...devices['Desktop Safari'] },
          },
          {
            name: 'Mobile Chrome',
            use: { ...devices['Pixel 5'] },
          },
          {
            name: 'Mobile Safari',
            use: { ...devices['iPhone 12'] },
          },
        ]),
  ],
});
