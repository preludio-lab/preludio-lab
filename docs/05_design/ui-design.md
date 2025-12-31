# UIデザイン仕様書 ＆ トークン (v1.0)

## 1. コンセプト: "Timeless & Modern"

**キーワード:** Precision (精緻), Clarity (明快), Warmth (温かみ), Focus (没入).
**ビジュアルスタイル:** スイス・スタイル (タイポグラフィ中心), クリーンなレイアウト, ハイコントラスト, 繊細なマイクロインタラクション.

---

## 2. カラーシステム (Tailwind Base)

### プライマリパレット (ブランドカラー)

- **Ink Black (墨色):** `#0F0F12` (メインテキスト, ダークモード背景)
  - `text-primary` / `bg-primary`
- **Paper White (生成り):** `#F6F5F2` (ライトモード背景) - _完全な白(#FFFFFF)ではなく、僅かに温かみのある白。_
  - `bg-paper`
- **Classic Gold:** `#C5A065` (アクセント, リンク, プライマリボタン)
  - `text-accent` / `bg-accent`

### ニュートラルスケール (僅かに温かみのあるグレー)

| Token         | Hex (Light) | Hex (Dark) | 用途                    |
| :------------ | :---------- | :--------- | :---------------------- |
| `neutral-50`  | `#FAFAF9`   | `#0F0F12`  | アプリ背景              |
| `neutral-100` | `#F5F5F4`   | `#1C1C1F`  | サイドバー / カード背景 |
| `neutral-200` | `#E7E5E4`   | `#2C2C2E`  | ボーダー / 区切り線     |
| `neutral-300` | `#D6D3D1`   | `#3A3A3C`  | アイコン (非アクティブ) |
| `neutral-500` | `#78716C`   | `#8E8E93`  | セカンダリテキスト      |
| `neutral-700` | `#44403C`   | `#E5E5EA`  | プライマリテキスト      |
| `neutral-900` | `#1C1917`   | `#F2F2F7`  | 見出し                  |

### セマンティックカラー (機能色)

- **Info:** `#007AFF` (Blue) - 理論解説のハイライト
- **Success:** `#34C759` (Green)
- **Warning:** `#FF9500` (Orange)
- **Error:** `#FF3B30` (Red)

### グラデーション (Subtle)

- **Hero Glow:** `linear-gradient(135deg, rgba(197, 160, 101, 0.15) 0%, transparent 40%)`
- **Glass Surface:** `rgba(255, 255, 255, 0.6)` (Light) / `rgba(28, 28, 31, 0.6)` (Dark)

---

## 3. タイポグラフィ・システム

**基準サイズ:** 16px (1rem)
**スケール比:** Modern/Functional (約1.2倍)

### フォントファミリー

- **Serif (見出し):** `Noto Serif JP`, `serif`
  - H1, H2, ヒーローセクション用。「アカデミック」な印象を与える。
  - H1, H2, ヒーローセクション用。「アカデミック」な印象を与える。
  - **Performance:** CJK言語（日本語・中国語）のフォントはファイルサイズが大きいため、`preload: false` と `display: 'swap'` を設定し、読み込みブロックによるLCP遅延を防ぐ（システムフォントによる即時表示を優先）。欧文フォントは通常通りプリロードする。
- **Sans (本文/UI):** `Inter`, `Noto Sans JP`, `sans-serif`
  - インターフェース、長文用。「モダンで読みやすい」印象を与える。
- **Mono (コード/データ):** `JetBrains Mono`, `monospace`
  - ABC記法スニペット, 分析コード用。

### スタイル定義

| Token       | Font  | Size (rem)   | Weight     | Line Height | Tracking | 用途               |
| :---------- | :---- | :----------- | :--------- | :---------- | :------- | :----------------- |
| **Display** | Serif | 3.0 (48px)   | 700 (Bold) | 1.1         | -0.02em  | ヒーローエリア H1  |
| **H1**      | Serif | 2.25 (36px)  | 600 (Semi) | 1.2         | -0.01em  | ページタイトル     |
| **H2**      | Serif | 1.75 (28px)  | 600 (Semi) | 1.3         | -0.01em  | セクションタイトル |
| **H3**      | Sans  | 1.25 (20px)  | 600 (Semi) | 1.4         | 0        | カードタイトル     |
| **Body L**  | Sans  | 1.125 (18px) | 400 (Reg)  | 1.7         | 0        | 記事本文           |
| **Body M**  | Sans  | 1.0 (16px)   | 400 (Reg)  | 1.6         | 0        | UI要素 (通常)      |
| **Caption** | Sans  | 0.875 (14px) | 500 (Med)  | 1.5         | 0.02em   | メタ情報           |
| **Tiny**    | Sans  | 0.75 (12px)  | 500 (Med)  | 1.5         | 0.05em   | バッジ             |

---

## 4. レイアウトとスペーシング

**基本単位:** 4px

### スペーシング・スケール

- `0.5` (2px), `1` (4px), `2` (8px), `3` (12px), `4` (16px), `6` (24px), `8` (32px), `12` (48px), `16` (64px)

### コンテナ最大幅

- **Article (記事):** `max-w-prose` (65ch) - 読みやすさに最適化された文字数。
- **App (全体):** `max-w-7xl` (1280px)

### Z-Index レイヤー

- `z-0`: 基本コンテンツ
- `z-10`: Stickyヘッダー
- `z-30`: フローティングプレイヤー (Mini)
- `z-40`: オーバーレイ / ドロップダウン
- `z-50`: モーダル / Focusモード

---

## 5. エフェクト (Effects)

### 角丸 (Border Radius)

- `sm`: 4px (ボタン, 入力欄)
- `md`: 8px (カード, 小さなダイアログ)
- `lg`: 12px (大きなカード)
- `full`: (ピルボタン, アバター)

### 影 (Shadows - 柔らかく拡散させる)

- `shadow-sm`: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
- `shadow-md`: `0 4px 6px -1px rgb(0 0 0 / 0.1)`
- `shadow-lg`: `0 10px 15px -3px rgb(0 0 0 / 0.1)` (浮いている要素)

### ブラー (Glassmorphism)

- `backdrop-blur-md`: `12px` (ヘッダー, Miniプレイヤー)

---

## 6. コンポーネント仕様 (Component Specs)

### Button (ボタン)

- **Primary:** 背景 `Classic Gold`, 文字 `text-primary` (#0F0F12), Hover `opacity-90` (透明度で変化).
- **Secondary:** 枠線 `neutral-200`, 文字 `primary`, Hover `bg-neutral-100`.
- **Ghost:** 文字 `primary`, Hover `bg-neutral-100`.

### Score View (楽譜ビュー)

- **Light Mode:**
  - 背景: `bg-paper` (#F6F5F2)
  - 五線譜/音符: `text-primary` (#0F0F12)
  - カーソルハイライト: `rgba(197, 160, 101, 0.3)` (Gold 30%)
- **Dark Mode:**
  - 背景: `bg-neutral-900` (または `transparent`)
  - 五線譜/音符: `text-neutral-200` (#E7E5E4) <-- 白に近いグレーに反転
  - カーソルハイライト: `rgba(197, 160, 101, 0.5)` (少し濃いGold)

### Mini Player (ミニプレイヤー)

- **高さ:** 64px
- **外観:** Glassmorphism (半透明 + ブラー背景).
- **配置:** Fixed Bottom (画面下部固定), `z-30`.

---

## 7. 変更容易性とテーマ管理 (Changeability)

トライ＆エラーを高速に行うため、以下の実装ルールを徹底する。

### [REQ-UI-SYS-004] Variable-First Strategy

- **Single Source of Truth:** 全ての色、フォント、基本スペーシングは `globals.css` 内の CSS Variables (`:root`) として定義する。Tailwind Configはこれを参照するだけに留める。
  - _メリット:_ `globals.css` の値を書き換えるだけで、アプリ全体の色味を一瞬で変更できる。
- **Prohibit Hardcoding:** コンポーネント内での「マジックナンバー」や「直接のHex指定」を禁止する。
  - NG: `text-[#333333]`, `w-[350px]`
  - OK: `text-primary`, `max-w-sm`

### [REQ-UI-SYS-005] Component Slots

- **Structure over Style:** コンポーネントは「構造」のみを責務とし、色や装飾はクラス名の付け替え（Variablesの変更）で対応できるように作る。
- レイアウト変更に強いよう、固定幅（px）ではなく、Flex/Gridと相対単位（%, rem）を使用する。

---

## 8. ページレイアウト仕様 (Page Layout Specs)

### ワーク詳細ページ (Work Detail Page)

- **コンテナ:** `max-w-6xl` (1152px) - コンテンツを中央に集め、没入感を高めるタイトな設計。
- **基本構造 (Desktop):**
  1.  **Header (Full Width):** ページタイトル、メタデータを横幅いっぱいに表示。グリッドには含めない。
  2.  **Grid System (12 Columns):**
      - **Main Content:** `col-span-7` (約60%) - 記事本文。`max-w-none` は使用せず、可読性の高い行長 (~65ch) を維持。余白を大きくとる。
      - **Gap:** `gap-16` ~ `gap-24` - コンテンツとサイドバーの分離を明確にする大きな余白。
      - **Sidebar:** `col-span-4` (約35%) - ウィジェットエリア。
- **レスポンシブ (Mobile / Tablet < lg):**
  - **Stacked Layout:** 2カラムグリッドを解除し、全てシングルカラムで表示。
  - **Sidebar Relocation:** デスクトップで右側にあった機能（Player, TOC）は、モバイルでは**記事本文の直上 (Pre-content)** に移動する。
  - **Collapsible TOC:** 目次はアコーディオン（`<details>`）に格納し、ファーストビューを占有しないようにする。

### Sidebar Widgets

- **Sticky Positioning:** スクロール追従 (`top-24`).
- **Component Visuals:** 2. **Listening Guide:** **Light Theme Card** (Paper/White bg). テキスト情報として本文と馴染ませる。

---

## 9. Defensive Design for i18n (多言語対応のための防御的設計)

言語によってテキストの長さは大きく異なる（日本語は短く、ドイツ語やフランス語は長くなる傾向がある）。レイアウト崩れを防ぐため、以下のルールを適用する。

### [REQ-UI-I18N-001] Layout Stability

- **Grid over Flex for Layouts:** ヘッダーやナビゲーションなど、要素の幅が変わりうる場所では、Flexboxの「成り行き任せ」な配置よりも、Grid Layout (`grid-cols-[auto_1fr_auto]`) を使用して構造を固定することを推奨する。
- **Whitespace Control:** ボタンやナビゲーションリンク内のテキストは、意図しない改行を防ぐため `whitespace-nowrap` を適用する。
- **Min-Width Strategy:** 最も長い言語（例: ドイツ語）でも破綻しないだけの十分な余白または `min-width` を確保する。
