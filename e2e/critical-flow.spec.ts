import { test, expect } from '@playwright/test';

/**
 * @fileoverview 主要ユーザーフローのE2Eテスト
 * 閲覧、言語切り替え、音源再生（Mini/Immersive Player）のクリティカルパスを検証します。
 *
 * 前提条件:
 * - テスト対象の固定データ（バッハ：プレリュード）がDB/R2に存在すること
 */

/**
 * テスト対象の定数定義
 */
const TARGET_ARTICLE = {
  path: '/ja/works/johann-sebastian-bach/wtc-1/1-prelude',
  title: 'プレリュード ハ長調',
  composer: 'ヨハン・セバスチャン・バッハ',
  slug: '1-prelude',
  category: 'works',
};

test.describe('Critical User Flows', () => {
  /**
   * シナリオ 1: 閲覧フロー (Browsing Experience)
   * ホームから一覧、詳細ページまで正しく遷移でき、コンテンツが表示されることを検証します。
   */
  test('閲覧フロー: ホームから作品詳細までの遷移', async ({ page }) => {
    await test.step('Step 1: ホームページにアクセス', async () => {
      await page.goto('/ja');
      await expect(page).toHaveTitle(/Preludio Lab/);
      // Featured Work (ピックアップ) セクションの存在確認
      await expect(page.getByTestId('featured-heading')).toBeVisible({ timeout: 20000 });
    });

    await test.step('Step 2: 作品一覧ページへ遷移', async () => {
      // ナビゲーションからWorksへ
      await page
        .getByRole('link', { name: 'Works' })
        .or(page.getByRole('link', { name: '作品一覧' }))
        .first()
        .click();
      await expect(page).toHaveURL(/\/ja\/works/);
    });

    await test.step('Step 3: 特定の作品（バッハ：プレリュード）の詳細ページへ遷移', async () => {
      // リストからタイトルを探してクリック
      await page.getByText(TARGET_ARTICLE.title).first().click();
      await expect(page).toHaveURL(new RegExp(TARGET_ARTICLE.path));
    });

    await test.step('検証: 詳細ページの表示要素', async () => {
      // タイトルと作曲家
      await expect(page.getByRole('heading', { level: 1 })).toContainText(TARGET_ARTICLE.title);
      await expect(page.getByText(TARGET_ARTICLE.composer).first()).toBeVisible();

      // 楽譜（ScoreRenderer）のレンダリング確認
      const scoreContainer = page.locator('.abcjs-container').first();
      // レンダリングに時間がかかる場合があるため、少し待機を含めて確認
      await expect(scoreContainer).toBeVisible({ timeout: 10000 });
      await expect(scoreContainer.locator('svg')).toBeVisible();
    });
  });

  /**
   * シナリオ 2: 言語切り替えフロー (i18n & Persistence)
   * 言語の切り替えと、リロード後も設定が維持されることを検証します。
   */
  test('言語切り替えフロー: 日本語から英語への切り替えと維持', async ({ page }) => {
    // 作品詳細ページから開始して、コンテンツの翻訳も検証する
    await page.goto(TARGET_ARTICLE.path);
    await expect(page.getByRole('heading', { level: 1 })).toContainText(TARGET_ARTICLE.title);

    await test.step('Step 1: 言語を日本語から英語へ切り替える', async () => {
      // LanguageSwitcherのトリガーをクリック
      const switcher = page.getByRole('button', { name: /JA|日本語/ }).first();
      await switcher.click();

      // 英語の選択肢をクリック
      await page.getByRole('option', { name: 'English' }).click();

      // URLが /en に変更されたことを確認
      await expect(page).toHaveURL(/\/en\/works\/johann-sebastian-bach\/wtc-1\/1-prelude/);
    });

    await test.step('Step 2: 英語UIとコンテンツの表示確認', async () => {
      // ナビゲーションなどの文言が英語になっているか
      await expect(page.getByRole('link', { name: 'Works' }).first()).toBeVisible();

      // Gold Set Data Verification: タイトルと作曲家名が英語になっているか
      // 言語切り替え完了を確実にするため、ENボタンの表示を待つなどのガードを入れる
      await expect(page.getByRole('button', { name: /EN|English/ })).toBeVisible();

      await expect(page.getByRole('heading', { level: 1 })).toContainText('Prelude in C Major');
      // Composer name check with retry/timeout
      await expect(page.getByText(/Johann Sebastian Bach|J\.S\. Bach/i).first()).toBeVisible({
        timeout: 10000,
      });
    });

    await test.step('Step 3: リロードしても言語が維持されるか', async () => {
      await page.reload();
      await expect(page).toHaveURL(/\/en/);
      await expect(page.getByRole('button', { name: /EN|English/ }).first()).toBeVisible();
      await expect(page.getByRole('heading', { level: 1 })).toContainText('Prelude in C Major');
    });
  });

  /**
   * シナリオ 3: 再生フロー (Playback & Focus Mode)
   * 音源の再生、Mini Playerの表示、Focus Mode（Immersive Player）への遷移を検証します。
   */
  test('再生フロー: プレイヤーの起動と没入モードの検証', async ({ page }) => {
    await page.goto(TARGET_ARTICLE.path);

    await test.step('Step 1: 再生を開始する', async () => {
      // 記事内の再生ボタンをクリック
      const playBtn = page.getByTestId('play-button').first();
      // ボタンが表示され、操作可能になるのを待つ。hoverが必要な場合はforce:trueで調整
      await expect(playBtn).toBeAttached({ timeout: 15000 });
      await playBtn.click({ force: true });
    });

    await test.step('Step 2: Mini Playerが現れることを確認', async () => {
      // aria-label="Open Full Player" を持つ領域を探す
      const openFullBtn = page.getByLabel('Open Full Player');
      await expect(openFullBtn).toBeVisible();

      // 再生中（Pauseボタンが表示されている）ことを確認
      await expect(page.getByLabel('Pause')).toBeVisible();
    });

    await test.step('Step 3: Focus Mode (Immersive Player) へ遷移', async () => {
      // Mini Playerを叩いて拡大
      await page.getByLabel('Open Full Player').click();

      // Immersive Player (z-[60]のオーバーレイ) が表示されているか
      // "Now Playing" というテキストが含まれる
      await expect(page.getByText('Now Playing')).toBeVisible();
      await expect(page.getByRole('heading', { name: TARGET_ARTICLE.title })).toBeVisible();
    });

    await test.step('Step 4: 没入モードでのソース情報確認', async () => {
      // YouTubeへのリンクやプロバイダー情報が表示されているか
      // next-intlの 'Player.provider.youtube' が "YouTube" 等であると仮定
      const sourceLink = page.locator('a[href*="youtube.com"]');
      await expect(sourceLink).toBeVisible();
    });

    await test.step('Step 5: 没入モードを閉じる', async () => {
      const minimizeBtn = page.getByLabel('Minimize Player');
      await minimizeBtn.click();

      // Immersive Playerが消えたことを確認
      await expect(page.getByText('Now Playing')).not.toBeVisible();
      // Mini Playerは残っているはず
      await expect(page.getByLabel('Open Full Player')).toBeVisible();
    });
  });

  /**
   * シナリオ 4: エラーレジリエンス (Error Handling)
   * 存在しないページにアクセスした際の404表示を検証します。
   */
  test('エラーハンドリング: 存在しない記事へのアクセス', async ({ page }) => {
    await page.goto('/ja/works/unknown/invalid-slug');
    // 404の文言または特定のheadingを確認
    await expect(page.getByText(/404|Not Found/i).first()).toBeVisible();
  });
});
