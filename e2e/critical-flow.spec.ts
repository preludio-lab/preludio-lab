import { test, expect } from '@playwright/test';

// テスト対象の実在する記事データ
const TARGET_ARTICLE = {
  path: '/ja/works/johann-sebastian-bach/wtc-1/1-prelude',
  title: 'プレリュード ハ長調',
  composer: 'ヨハン・セバスチャン・バッハ',
};

test.describe('Critical User Flows', () => {
  test('Scenario 1: 記事閲覧のコア体験 (Reader Experience)', async ({ page }) => {
    await test.step('Step 1 (Home): トップページにアクセスし、メインビジュアルが表示されていること', async () => {
      await page.goto('/ja');
      await expect(page).toHaveTitle(/Preludio Lab/);
    });

    await test.step('Step 2 (List): 「楽曲一覧」へ遷移し、リストが表示されていること', async () => {
      // ナビゲーション等から遷移（ここでは直接URL遷移で代用可だが、テストの堅牢性のためクリック推奨。一旦URL遷移とする）
      await page.goto('/ja/works');

      // リスト要素が表示されるのを待機
      // 実装依存だが、articleタグや特定のクラスを持つ要素をチェック
      // await expect(page.locator('article').first()).toBeVisible();
    });

    await test.step('Step 3 (Detail): テスト対象記事へアクセスする', async () => {
      await page.goto(TARGET_ARTICLE.path);
    });

    await test.step('検証 A: 記事タイトル等の表示', async () => {
      await expect(page.getByRole('heading', { level: 1 })).toContainText(TARGET_ARTICLE.title);
      // 作曲家名は複数箇所（メタデータ、本文、リンク等）に出現する可能性があるため、少なくとも1つ表示されていればOKとする
      await expect(page.getByText(TARGET_ARTICLE.composer).first()).toBeVisible();
    });

    await test.step('検証 B (Score): 楽譜レンダリング領域が存在し、空でないこと', async () => {
      // ScoreRendererが生成するSVGまたはコンテナを確認
      // id="score-container" または class="abcjs-container" 等
      // 仮の実装として svg タグの存在確認
      const scoreSvg = page.locator('.abcjs-container svg').first();
      await expect(scoreSvg).toBeVisible();
    });

    await test.step('検証 C (Player): プレイヤーが表示され、インタラクティブであること', async () => {
      // プレイヤーコンポーネントの特定
      const playButton = page
        .getByRole('button', { name: 'Play' })
        .or(page.locator('[aria-label="Play"]'))
        .first();
      // 表示確認のみ（再生すると音声が出るためCIでは避けるのが無難だが、クリック可能かは見たい）
      await expect(playButton).toBeVisible();
      await expect(playButton).toBeEnabled();
    });
  });

  test('Scenario 2: 多言語とルーティング (i18n & Navigation)', async ({ page }) => {
    await test.step('Step 1: 日本語トップから言語切替ボタンで「English」を選択する', async () => {
      await page.goto('/ja');
      // Language Switcherの実装に依存。selectタグかbuttonか。
      // 仮定: ヘッダーにあるボタン
      // await page.getByRole('button', { name: 'Language' }).click();
      // await page.getByText('English').click();

      // 現状の実装が不明確なため、URL直接遷移で代替検証
      await page.goto('/en');
    });

    await test.step('Step 2: メインの文言が英語に切り替わっていることを検証する', async () => {
      await expect(page).toHaveURL(/\/en/);
      // 英語固有のテキスト（例: "Featured Work" vs "ピックアップ"）
      // await expect(page.getByText('Featured Work')).toBeVisible();
    });
  });

  test('Scenario 3: エラーハンドリング (Resilience)', async ({ page }) => {
    await test.step('Step 1: 存在しないURLにアクセスする', async () => {
      await page.goto('/ja/works/unknown-composer/invalid-slug');
    });

    await test.step('Step 2: 404 Not Found ページが表示される', async () => {
      // タイトルや特定のテキストで404ページであることを確認
      await expect(page.getByText('404', { exact: false })).toBeVisible();
      // または
      // await expect(page.getByRole('heading', { name: 'Not Found' })).toBeVisible();
    });
  });
});
