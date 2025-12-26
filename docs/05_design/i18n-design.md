# Internationalization (i18n) Design

## 1. Overview
本ドキュメントは、Preludio Lab における多言語対応（Internationalization）のアーキテクチャ設計を定義する。
[REQ-TECH-STACK-011] に基づき、`next-intl` を採用し、クリーンアーキテクチャの原則に従って実装する。

## 2. Architecture & Layering

### 2.1. Layer Responsibility
クリーンアーキテクチャに基づき、各層の責務を以下のように分担する。

| Layer | Path | Component | Responsibility |
| :--- | :--- | :--- | :--- |
| **Domain** | `src/domain/i18n/Locale.ts` | **Shared Kernel** | アプリケーションがサポートする言語（`AppLocale`）とデフォルト言語の定義。**外部ライブラリ（next-intl等）への依存は厳禁**。純粋な TypeScript 型として定義する。 |
| **Infrastructure** | `src/middleware.ts` | **Driver** | Next.js のエントリーポイント。HTTPリクエストを傍受し、ロケール判定とリダイレクトを行う。具体的処理は `next-intl` に委譲。 |
| **Infrastructure** | `src/infrastructure/i18n/` | **Adapter** | `next-intl` の設定 (`config.ts`)、ナビゲーションラッパー (`navigation.ts`)、および辞書ファイル (`messages/*.json`) の配置。 |
| **UI** | `src/components/features/i18n/` | **Presenter** | `LanguageSwitcher` 等のUIコンポーネント。Infra層の `navigation` アダプタを利用して遷移する。 |

### 2.2. Dependency Graph
```mermaid
graph TD
    subgraph UI [UI Layer]
        Switcher[LanguageSwitcher]
        Layout[RootLayout]
    end

    subgraph Infra [Infrastructure Layer]
        Nav[i18n/navigation.ts]
        Config[i18n/config.ts]
        Middleware[src/middleware.ts]
    end

    subgraph Domain [Domain Layer (Shared)]
        Locale[i18n/Locale.ts]
    end

    %% Dependencies
    Switcher -->|import| Nav
    Nav -->|import| Locale
    Config -->|import| Locale
    Middleware -->|import| Locale
    Layout -->|import| Locale
```

### 2.3. Clean Architecture Compliance (Crucial)
*   **No Library Leakage:** `src/domain/` 配下のファイルは、`next-intl` や `next/navigation` を import してはならない。
    *   OK: `export type AppLocale = 'en' | 'ja';`
    *   NG: `import { Locale } from 'next-intl';`

## 3. Data Strategy

### 3.1. URL Structure
Sub-path Routing を採用する。
*   `preludiolab.com/en/...` (Verified)
*   `preludiolab.com/ja/...` (Verified)
*   `preludiolab.com/` -> (307 Redirect) -> `preludiolab.com/{locale}`

### 3.2. Dictionary Schema
UI翻訳辞書は JSON 形式で管理し、TypeScript の型安全性を確保する（`next-intl` の `global.d.ts` 拡張を利用）。

### 3.3. Type-Safe Routing
`src/infrastructure/i18n/navigation.ts` にて `createSharedPathnamesNavigation` を使用し、リンク生成時にパス（`href`）の実在チェックを行う仕組みを導入する。これにより、無効なリンク切れをビルド時に検知可能にする。

## 4. SEO Strategy

### 4.1. Hreflang Tags
Google などの検索エンジンに対し、各言語のページが「同じコンテンツの翻訳版」であることを伝えるため、`RootLayout` にて `Link` ヘッダーまたは `<link rel="alternate" ... />` を出力する。

### 4.2. Dynamic Metadata
各ページの `generateMetadata` 関数内で `getTranslations` を使用し、言語ごとに最適化されたタイトル・Descriptionを出力する。

### 4.3. Localized OGP
`vercel/og` を使用し、ロケールをパラメータとして受け取る動的OGP画像を生成する。
*   **Example:**
    *   English: "Design Patterns in Major Keys"
    *   Japanese: "長調におけるデザインパターン"
*   これにより、SNSシェア時の没入感とClick-Through Rate (CTR) を最大化する。

## 5. Typography Strategy (Emotional Localization)
言語ごとに最適なフォント定義（Font Stack）を切り替え、楽曲への愛情や文化的背景（情緒）を正しく伝える。

*   **Logic:** `RootLayout` にて現在の `locale` を判定し、`body` タグに付与するフォントクラス (`className`) を動的に変更する。
*   **Definition (Tailwind Config):**
    *   `font-serif-en`: *Playfair Display*, serif (Classical & Elegant)
    *   `font-serif-ja`: *Zen Old Mincho*, serif (Emotional & Readable)
    *   `font-sans-en`: *Inter*, sans-serif
    *   `font-sans-ja`: *Noto Sans JP*, sans-serif

## 6. Implementation Roadmap
1.  **Domain Definition**: `src/domain/i18n/Locale.ts` の作成。
2.  **Infrastructure Setup**: `next-intl` のインストールと `middleware.ts`, `config.ts`, `navigation.ts` の実装。
3.  **UI Setup**: フォント定義 (`tailwind.config.ts`) と `RootLayout` への組み込み。
4.  **Component**: `LanguageSwitcher` の実装。
