# ルーティング設計 (Routing Design)

## 1. URL構造の原則
`domain/[lang]/[category]/[slug]`

*   **[lang]:** `ja` (JP), `en` (US/UK), `es` (ES/LATAM), `de` (DE), `zh` (CN), `fr` (FR), `it` (IT)
*   **[category]:** リソースコレクション名（複数形）
*   **[slug]:** 一意の識別子（ケバブケース）

## 2. ルートマップ (Route Map)

| URLパターン | ページ種別 | 説明 |
| :--- | :--- | :--- |
| `/` | Redirect | デフォルト言語（`/ja`）へリダイレクト（Middlewareで処理）。 |
| `/[lang]` | **Top Page** | ランディングページ。ヒーロー、カテゴリ、新着記事。 |
| `/[lang]/works` | **Index** | 楽曲分析記事の一覧。フィルタ機能付き。 |
| `/[lang]/works/[slug]` | **Detail** | **(Core)** 楽曲分析の詳細記事。楽譜と音源を含む。 |
| `/[lang]/composers` | **Index** | 作曲家一覧。 |
| `/[lang]/composers/[slug]` | **Detail** | 作曲家プロフィールとその作品リスト。 |
| `/[lang]/theory` | **Index** | 音楽理論記事の一覧。 |
| `/[lang]/theory/[slug]` | **Detail** | 理論解説の詳細。 |
| `/[lang]/about` | **Static** | プロジェクトについて。 |

## 3. リダイレクトルール (Redirect Rules)
*   `/` -> `/ja` (現在は 307 Temporary Redirect、将来的に 308 Permanent)
*   言語パスなしでの `/works/[slug]` への直接アクセスは不可（Middlewareが処理）。
