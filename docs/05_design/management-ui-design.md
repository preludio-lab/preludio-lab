# Management UI Design Specifications

Figma AIによって生成され、合意された管理画面のデザイン仕様。本ドキュメントは、管理UI実装における「正解（Source of Truth）」として機能する。

## 1. デザイン・フィロソフィ

- **High Productivity:** 管理者が効率的にデータを操作できる、密度が高くかつ清潔なインターフェース。
- **Timeless & Modern:** トレンドに左右されすぎず、長期的なメンテナンスに耐えうる標準的なUIパターンを採用する。
- **Light Theme First:** デフォルトでは明るく清潔なライトテーマを採用し、将来的なダークモード対応を考慮した設計とする。

## 2. レイアウト構造 (Layout)

| [Component]      | 仕様/サイズ      | 背景色    | 備考                                         |
| ---------------- | ---------------- | --------- | -------------------------------------------- |
| **Sidebar**      | 幅: 240px (固定) | `#F9FAFB` | ナビゲーション用。垂直メニュー。             |
| **Header**       | 高さ: 64px       | `#FFFFFF` | パンくずリスト・検索・アクションボタン。     |
| **Main Content** | 可変             | `#F3F4F6` | コンテンツエリア。内側パディング 32px-40px。 |
| **Cards/Tables** | 可変             | `#FFFFFF` | 各データ項目やリストの背景。                 |

## 3. カラー・システム (Color Tokens)

### 3.1. Brand Colors

- **Primary Blue:** `#2563EB` (Tailwind `blue-600`)
  - 用途: 主要なボタン、アクティブなアイコン、フォーカス状態。
- **Primary Light:** `#EFF6FF` (Tailwind `blue-50`)
  - 用途: アクティブなナビゲーション項目の背景。

### 3.2. Semantic Colors

- **Success:** `#10B981` (Tailwind `emerald-500`)
  - 用途: 「公開」「保存」などのポジティブなアクション。
- **Danger:** `#EF4444` (Tailwind `red-500`)
  - 用途: 「削除」「警告」などの破壊的なアクション。
- **Warning:** `#F59E0B` (Tailwind `amber-500`)
  - 用途: 「未公開」「注意」などのステータス。

### 3.3. Neutral Colors

- **Text Primary:** `#111827` (Tailwind `slate-900`)
- **Text Secondary:** `#6B7280` (Tailwind `slate-500`)
- **Border/Divider:** `#E5E7EB` (Tailwind `slate-200`)

## 4. タイポグラフィ (Typography)

- **Main Font:** Inter, system-ui, sans-serif
- **Heading 1:** 24px, Bold, `#111827`
- **Heading 2:** 18px, Semi-bold, `#111827`
- **Body:** 14px, Regular, `#374151`
- **Caption:** 12px, Regular, `#6B7280`

## 5. 主要コンポーネント (Key Components)

### 5.1. Sidebar Navigation

- アイコンとテキストの組み合わせ。
- ホバー時、クリック時のビジュアルフィードバック。

### 5.2. Data Table

- 固定幅のカラム設定。
- 行のホバーエフェクト。
- 「アクション」カラム（編集/削除）の右端配置。

### 5.3. Article Editor

- **Header:** タイトル、プレビュー、保存、公開。
- **Body:** タイトル入力 (Input)、著者 (Input)、タグ (Multi-select)、本文 (Textarea/Markdown)。

## 6. Figma Reference

- [Figma URL](https://www.figma.com/make/m7chD7HGbFowfKT05wUelo/%E3%82%AF%E3%83%A9%E3%82%B7%E3%83%83%E3%82%AF%E9%9F%B3%E6%A5%BD%E3%82%B5%E3%82%A4%E3%83%88%E7%AE%A1%E7%90%86UI?t=VSsYQNDwB2n8AMZz-1)
