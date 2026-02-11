# Featured Content Specifications & Logic

## 1. Overview

本ドキュメントは、Preludio Labのホーム画面における**「Featured Content（注目の作品）」の動的選定・取得ロジック**に関する仕様書です。
ホーム画面の他の要素（Discoverセクション、Footerなど）は静的なルーティングや固定レイアウトであり、本ドキュメントでは主に動的ロジックとアーキテクチャ上の責任分界点について定義します。

## 2. Architecture & Layer Responsibilities

`docs/02_guidelines/development-guidelines.md` (Clean Architecture) に基づく、本機能の実装アーキテクチャです。

### 2.1. Domain Layer (`src/domain`)

- **責務**: コンテンツのコア定義。
- **Components**:
  - `ContentSummary` (Entity): 軽量なコンテンツデータ構造。
  - `SUPPORTED_CATEGORIES`: アプリケーションで扱うカテゴリ定数。
  - `IContentRepository` (Interface): データアクセスの抽象化。

### 2.2. Application Layer (`src/application`)

- **責務**: Featuredコンテンツを選定するビジネスロジック。
- **Components**:
  - `GetFeaturedContentUseCase`: 複数のカテゴリからデータを横断的に取得し、特定の基準（Criteria）に基づいて1つを選定する。
  - **Logic**:
    - **Scope**: 全 `SUPPORTED_CATEGORIES` (`works`, `composers` 等)
    - **Criteria**: `latest` (Date降順で最新の1件)

### 2.3. UI Layer (`src/components/content`)

- **責務**: 選定されたデータの表示（Presentation）。
- **Components**:
  - `FeaturedSection` (Organism): `ContentSummary` を受け取り、既存のデザイン（フォント、色、レイアウト）を厳密に維持して表示する。
  - **UI Logic**:
    - データが存在しない場合は何もレンダリングしない（`null`）。
    - Framer Motion によるフェードイン演出。

## 3. Data Strategy

### 3.1. Selection Logic (Current)

- **Input**: `lang` (言語), `criteria` (選定基準)
- **Process**:
  1.  全カテゴリのリポジトリから `getAllContentSummaries` を並列実行。
  2.  結果をフラットな配列に結合。
  3.  `criteria='latest'` の場合、`metadata.date` で降順ソート。
  4.  先頭の1件を返却。

### 3.2. Future Extensibility

将来的な拡張として、ユースケースは以下の `criteria` を受け入れられる設計としています。

- `popular`: PV数やいいね数に基づく選定（将来）
- `editor_pick`: 特定のIDを指定した固定表示（将来）

## 4. Other Homepage Elements (Static)

ホーム画面の Featured Content 以外の要素は、動的ロジックを持たない静的な構成です。

- **Hero Section**: 静的なキャッチコピーと主要ページへのリンク。
- **Discover Section**: `SUPPORTED_CATEGORIES` 定数に基づき、各カテゴリ一覧ページ（`/works` 等）へのリンクカードを生成。
