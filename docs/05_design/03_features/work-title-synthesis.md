# 楽曲タイトル自動合成システム (Work Title Synthesis) 設計書

## 1. 概要 (Overview)

PreludioLabにおける楽曲タイトルは、これまで `prefix`, `content`, `nickname` という表示レイアウトに依存した形式で管理されていました。
本設計では、タイトルの構成要素を「意味論的（セマンティック）な属性（事実）」として構造化し、システム側で多言語（7ヶ国語）に対応した最適なタイトル文字列を自動合成する仕組みを定義します。

## 2. データ構造 (Data Structure)

### 2.1 TitleComponentsSchema (事実の器)

楽曲タイトルの「骨格」を定義するスキーマです。合成時には、Work エンティティが持つ `genreId` や `keyId` から解決された翻訳名が外部コンテキストとして供給されます。

楽曲タイトルの「骨格」を定義するスキーマです。

| フィールド         | 型                   | 必須 | 説明                                  |
| :----------------- | :------------------- | :--- | :------------------------------------ |
| `displayType`      | `TitleDisplayType`   | YES  | タイトル全体の表示形式パターン (後述) |
| `number`           | `number (int)`       | NO   | 楽曲の通し番号 (例: 5)                |
| `distinctiveTitle` | `MultilingualString` | NO   | 固有のタイトル (例: くるみ割り人形)   |
| `nickname`         | `MultilingualString` | NO   | 広く知られた愛称 (例: 運命)           |

#### TitleDisplayType の詳細

1. **`standard`**: `[ジャンル名+番号] [調性] [愛称] [作品番号]` の順で結合。最も一般的。
2. **`catalogue-only`**: 作品番号が支配的な楽曲用 (例: スカルラッティのソナタ `Kk. 1`)。
3. **`title-priority`**: 固有タイトルを最優先する形式 (例: ワーグナーの楽劇)。
4. **`custom`**: 完全にマニュアルで文字列を指定する最終手段。

### 2.2 CatalogueSchema (既存)

既存の `CatalogueSchema` から以下の事実を抽出に利用します。

| フィールド | 型                | 説明                                                                        |
| :--------- | :---------------- | :-------------------------------------------------------------------------- |
| `prefix`   | `CataloguePrefix` | `op`, `bwv`, `k` 等の正規化されたID (Source: `musical-catalogue-prefix.ts`) |
| `number`   | `string`          | 番号部分 (例: "67", "331a")                                                 |

## 3. 合成ロジック (Synthesis Logic)

### 3.1 Synthesis Patterns (タイトル合成パターン)

`TitleComponents.displayType` に応じて、以下の結合優先順位を適用します。

#### A. standard (標準形式)

最も汎用的な形式。ジャンル名・番号・調性・愛称・作品番号をすべて含む。

- **構成**: `[ジャンル名+番号] [調性] [「愛称」] [作品番号]`
- 日本語例: `交響曲 第5番 ハ短調 「運命」 作品67`
- 英語例: `Symphony No. 5 in C minor "Fate", Op. 67`

#### B. catalogue-only (目録番号主体)

作品番号自体が楽曲の一意識別子として機能する場合（ソナタ、カンタータ等）。

- **構成**: `[ジャンル名] [調性] [作品番号]`
- 日本語例: `ソナタ ニ短調 Kk. 1`
- 英語例: `Sonata in D minor, Kk. 1`

#### C. title-priority (固有タイトル優先)

固有の楽曲題名や標題が主役の場合。

- **構成**: `[固有タイトル] [調性] [作品番号]`
- 日本語例: `幻想交響曲 ハ長調 作品14`
- 英語例: `Symphonie fantastique in C major, Op. 14`

#### D. custom (カスタム)

上記のルールに当てはまらない連作や特殊な構成。システムによる自動合成を行わず、マニュアルで指定された文字列を優先。

### 3.2 スペーサーと例外処理 (Separators & Exception Handling)

- **条件付きスペーサー**: フィールド（`number`, `nickname` 等）が空の場合、前後のスペーサー（スペースやカンマ）を自動的に除去し、二重スペースや不自然な区切りを防ぎます。
- **フォールバック**: 多言語化された値がすべて空の場合、デフォルト言語（en）の値を参照、または ID をベースにした最低限の識別情報を出力します。

### 3.3 特殊変換ルール (Special Formatting Rules)

`WorkTitleFormatter` 内に音楽学的な慣習を封じ込めます。

- **遺作 (Op. posth)**:
  - 日本語: 末尾に `(遺作)` を付加。 (例: `作品66 (遺作)`)
  - 英語: 接頭辞を `Op. posth.` に変更。 (例: `Op. posth. 66`)
- **不変の接頭辞**:
  - `BWV`, `K.`, `Hob.` 等は全言語で共通。 (「作品」とは訳さない)

### 3.3 多言語辞書 (i18n Dictionary)

`src/domain/work/work.constants.ts` に、合成に使用するラベルを定義します。

```typescript
export const TITLE_LABELS = {
  ja: {
    numberPrefix: '第',
    numberSuffix: '番',
    opusPrefix: '作品',
    keyPrefix: '',
    nicknamePrefix: '「',
    nicknameSuffix: '」',
  },
  en: {
    numberPrefix: 'No. ',
    numberSuffix: '',
    opusPrefix: 'Op. ',
    keyPrefix: 'in ',
    nicknamePrefix: '"',
    nicknameSuffix: '"',
  },
  // 他5言語も同様
} as const;
```

## 4. 環境安全性の確保 (Environment Safety)

- **Pure Function**: `WorkTitleFormatter` は外部依存（DBやグローバルなi18nインスタンス）を持たず、`lang` パラメータを明示的に受け取る純粋関数として実装します。
- **Zero-Hydration Mismatch**: サーバーサイド(Node.js)とクライアントサイド(Browser)で同一のロジック・辞書を使用することで、Next.jsのハイドレーションエラーを防止します。

## 5. 検索最適化 (Search Optimization)

- **fullTitle キャッシュ**: 合成済みのタイトルを各言語ごとにデータベース（`works.full_title` JSONB列）に保存し、一覧表示時の計算コストをゼロにします。
- **searchText (FTS5)**: 全言語のタイトルを結合した検索用カラムを自動生成し、パフォーマンスを最大化します。
