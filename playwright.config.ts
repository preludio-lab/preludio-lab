import { defineConfig, devices } from '@playwright/test';
import path from 'path';

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
  reporter: process.env.CI ? [['list'], ['html']] : [['html']],
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

  snapshotPathTemplate:
    '{snapshotDir}/{testFileDir}/{testFileName}-snapshots/{arg}-{projectName}{ext}',

  /* Run your local dev server before starting the tests */
  globalSetup: './e2e/setup/global-setup.ts', // Use the new global setup for DB seeding

  // Vercel Preview 等の外部 URL をテストする場合は、ローカルサーバーの起動をスキップする
  webServer: process.env.PLAYWRIGHT_TEST_BASE_URL
    ? undefined
    : {
        command: 'npx next dev --webpack',
        timeout: 120000,
        url: 'http://localhost:3000',
        reuseExistingServer: true, // Allow using manually started server for local debugging
        env: {
          SKIP_ENV_VALIDATION: 'true',
          NEXT_PUBLIC_CDN_BASE_URL: 'http://localhost:3000',
          NEXT_PUBLIC_APP_ENV: 'test',
          // Auth.js 起動用 (32文字以上の文字列)
          AUTH_SECRET: 'dummy_secret_for_e2e_testing_purposes_only_32_chars',
          // ダミーインフラ設定 - Local SQLite + Drizzle
          TURSO_DATABASE_URL: `file://${path.join(process.cwd(), 'local-e2e.db')}`,
          ARTICLE_METADATA_SOURCE: 'db', // Explicitly use DB for metadata
          ARTICLE_CONTENT_SOURCE: 'r2', // Use R2 DS to trigger fallback to Gold Set on miss
          // R2 Dummy (Not used if ARTICLE_CONTENT_SOURCE=fs/fallback hits)
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
