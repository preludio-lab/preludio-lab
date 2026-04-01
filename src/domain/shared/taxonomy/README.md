# Taxonomy Domain

このディレクトリには、PreludioLab の核となる「楽曲タクソノミー（属性定義マスター）」が格納されています。

## 1. 概要 (Role)

本プロジェクトにおいて、タクソノミーは単なる「用語集」ではなく、**システムの挙動（属性検索、i18nラベル、作品メタデータ）を規定する単一の正解 (Single Source of Truth)** です。
データベース（DB）にマスタを持たず、これらの YAML ファイルを実行時に直接読み込む **Zero-Cost Architecture** を採用しています。

## 2. 構成 (Structure)

タクソノミーは以下の12個の YAML ファイルで構成されています。

- `00_keys.yaml`: 調性 (Keys)
- `01_eras.yaml`: 音楽史上の時代 (Eras)
- `02_genres.yaml`: 楽曲分類 (Genres / 作品種別)
- `03_instruments.yaml`: 楽器 (Instruments / 声域)
- `04_tags.yaml`: 楽曲の雰囲気・タグ (Tags)
- `05_impression_scales.yaml`: 印象評価軸 (Impression Scales) - **ドメイン定義 6軸準拠**
- `06_nationalities.yaml`: 国籍 (Nationalities)
- `07_levels.yaml`: 難易度・注目度 (Levels / Trending)
- `08_catalogues.yaml`: 作品目録 (Catalogues / BWV, Op. 等)
- `09_places.yaml`: 都市・場所 (Places)
- `10_misc.yaml`: その他雑多なメタデータ (Work Part Type 等)
- `11_forms.yaml`: 楽曲形式・技法 (Form / 内部構造)

## 3. 編集・追加ルール (Best Practices for Agents & Humans)

### 3.1. ID の管理

- **不可変性**: 一度定義された `id` は原則として変更・削除してはなりません。DB 側で既にこの ID が参照されている可能性があるためです。
- **命名規則**: 小文字のケバブケース (`kebab-case`) を使用してください。

### 3.2. 多言語対応 (i18n)

- **7言語必須**: 以下の7言語すべてに対する `label` および `description` (可能な限り) を提供してください。
  - `ja`: 日本語
  - `en`: 英語
  - `de`: ドイツ語
  - `fr`: フランス語
  - `it`: イタリア語
  - `es`: スペイン語
  - `zh`: 中国語 (簡体字)

### 3.3. ジャンルと形式の分離 (Dual-Presence Strategy)

- 「ジャンル（作品種別）」と「形式（内部構造）」を物理的に分離しています。
- 同じ用語（例：Variations, Fugue）でも、**ジャンル側 (`02_genres`) では歴史的背景や代表作**を記述し、**形式側 (`11_forms`) では構造的・技法的な解説**を記述することで、異なる視点からの検索体験を両立させています。

### 3.4. 品質と知的発見

- `description` は単なる辞書的な説明に留めず、ユーザーに新たな「知的発見」を提供するような気品ある文章（博物館のキャプションのような質）を目指してください。

## 4. バリデーション (Validation)

YAML を編集した後は、必ず以下のスクリプトを実行してスキーマの整合性を確認してください。

```bash
pnpm tsx scripts/validate-taxonomy.ts
```

## 5. 実装の詳細

- **読み込み**: `TaxonomyFileRepository` (`src/infrastructure`) がファイルシステムから YAML を解析し、シングルトンとしてメモリにキャッシュします。
- **利用**: `TaxonomyRegistry` (`src/domain`) を通じて、ドメイン層や UI 層から ID ベースで属性情報を取得できます。
- **初期化**: `initTaxonomy.ts` (`src/application`) がサーバーサイドのレイアウト等から呼び出されます。

## 6. タクソノミーの活用方法 (Usage Guidelines)

開発者がタクソノミーをシステムに組み込む際は、以下の指針に従ってください。

### 6.1. 基本原則

- **一元化されたアクセス**: YAML ファイルをコンポーネントから直接 `import` したり、`fs` で直接読み込んだりしないでください。必ず `TaxonomyRegistry` または `TaxonomyFileRepository` を介してアクセスしてください。

### 6.2. UI 層でのラベル表示

- 特別の事情がない限り、`src/domain/shared/enum-labels.ts` に定義されたヘルパー関数（例: `getMusicalGenreLabel`, `getMusicalEraLabel`）を使用してください。
- これらの関数は内部で `TaxonomyRegistry` を参照しており、指定された `locale` に応じた適切な文字列を返却します。

### 6.3. サーバーサイド・ビルド時の利用

- サーバーコンポーネントやビルドスクリプトでは、`TaxonomyFileRepository` を使用して全タクソノミーデータを取得し、検索やフィルタリングの基盤として利用します。
- AI エージェントによるコンテンツ生成（作曲家や楽曲のメタデータ付与）の際は、リポジトリから取得した「最新の定義」をコンテキストとして渡すことで、データの一貫性を担保します。

### 6.4. 型安全性の確保

- タクソノミーの共通構造は `src/domain/shared/taxonomy/types.ts` に Zod スキーマとして定義されています。
- カテゴリの追加や構造の変更を行う場合は、まずこのドメインモデルのスキーマを更新し、`pnpm type-check` で影響範囲を確認して修正してください。

### 6.5. 多言語対応 (i18n) の遵守

- ラベルや解説を取得する際は、必ず現在のロケール（`ja`, `en`, `de` 等）を明示的に渡してください。
- ハードコーディングを避け、Next.js の `useLocale` や Page Props の `params.locale` から取得した値を活用してください。
