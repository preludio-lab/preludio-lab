import { test, expect } from '@playwright/test';

/**
 * @fileoverview ホームページ Feature セクションの Visual Regression Test
 *
 * ArticleHeroCard の表示品質（レイアウト、画像サイズ、バッジ視認性）を
 * スナップショットで検証します。初回実行時にリファレンス画像を自動生成し、
 * 以降はCIで差分検知として機能します。
 *
 * @see Issue #123 - Feature セクション画像サイズ修正
 */

test.describe('Home Feature Section - Visual Regression', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/ja');

    // Flakiness対策: Featured セクションが描画されるまで待機
    await expect(page.getByTestId('featured-heading')).toBeVisible({ timeout: 20000 });

    // 画像の読み込み完了を待機（ネットワークアイドル）
    await page.waitForLoadState('networkidle');

    // ヒーローカード内の画像要素が完全にロードされるまで待機
    const heroImage = page.locator('[data-testid="hero-card-image"]');
    if ((await heroImage.count()) > 0) {
      await expect(heroImage.first()).toBeVisible({ timeout: 10000 });
    }
  });

  test('Desktop (1280px): Feature セクションのレイアウト', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    // ビューポート変更後に再描画を待機
    await page.waitForTimeout(500);

    const featuredSection = page.getByTestId('featured-heading').locator('..');
    await expect(featuredSection).toHaveScreenshot('home-featured-desktop.png', {
      maxDiffPixelRatio: 0.01,
    });
  });

  test('Mobile (375px): Feature セクションのレイアウト', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);

    const featuredSection = page.getByTestId('featured-heading').locator('..');
    await expect(featuredSection).toHaveScreenshot('home-featured-mobile.png', {
      maxDiffPixelRatio: 0.01,
    });
  });
});
