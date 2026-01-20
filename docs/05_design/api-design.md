# API設計・スキーマ管理指針

## DTOとOpenAPI (OAS) の位置付け

本プロジェクトでは、アプリケーション内部およびクライアント（フロントエンド）とのデータ契約として **DTO (Data Transfer Object)** を定義します。

### 基本方針

- **Code First**: TypeScriptのDTO定義 (`zod` スキーマ等) を正とします。
- **OpenAPIの導入**:
  - DTOはアプリケーション内部の契約ですが、外部システムやフロントエンドとの明確なインターフェース定義として OpenAPI (Swagger) の有用性は認めます。
  - 現時点では必須としませんが、導入する場合は `docs/openapi/` 配下、または `src/interface/api/schemas` にYAML/JSONを配置することを推奨します。
  - 将来的には `zod-to-openapi` 等を用いて、Code Firstな実装からドキュメントを自動生成するフローを目指します。

## 検索結果データの設計 (Search Result DTO)

検索機能（キーワード検索、ベクトル検索）におけるデータ構造は、**コンポジション（包含）パターン**を採用します。

### 設計理由

「記事そのもののデータ（Metadata）」と「検索という行為によって付与されるデータ（Score, Highlight）」は、ライフサイクルと関心事が異なるため、継承（`extends`）ではなくコンポジションで表現すべきです。

### 推奨構造

一般的な記事リスト取得（新着、人気記事など）と、検索結果取得で型を明確に区別します。

#### 1. 通常リスト (List Response)

**利用シーン**:

- カテゴリ別一覧、タグ別一覧、新着記事
- 属性による絞り込み（作曲家フィルタ、時代フィルタなど）
- **検索スコアやハイライトが不要な場合**

```typescript
{
  items: ArticleMetadataDto[];
  totalCount: number;
}
```

#### 2. 検索結果 (Search Result Response)

**利用シーン**:

- 全文検索（キーワード検索）
- ベクトル検索（意味検索）
- **検索スコア（適合度）やハイライトが必要な場合**

**UI/UX戦略: ハイブリッド検索 (Unified Search)**
ユーザーには「キーワード検索」と「意味検索」を区別させず、**1つの検索ボックス**から統合された結果を提供します。

- ユーザー体験: 単一の検索体験（Google検索のような感覚）。キーワードが一致しなくても、意味が近いものがヒットする驚きを提供する。
- 技術的実装: バックエンドでキーワード検索（Keyword）とベクトル検索（Vector）を並行実行、またはハイブリッド実行し、スコアを統合して返却する。
  - `matchScore`: ベクトル類似度、またはハイブリッドスコア。
  - `highlightedText`: キーワードが一致した場合にセットされる。ベクトルのみのヒット時は `null` になる場合がある。

**順序付け（Ranking）の責任**
検索結果の並び順は **Use Case（バックエンド）の責務** です。

- 検索エンジン（Repository）がスコア順にソートした状態でデータを返却します。
- DTOの `items` 配列の順番＝表示順（Relevance Order）となります。
- UI側で再ソートを行う必要はありません。

```typescript
// 検索コンテキスト
interface ArticleSearchMetaDto {
  /** マッチ度/類似度 (ベクトル検索用) 0.0-1.0 */
  matchScore?: number;
  /** ハイライト箇所 (キーワード検索用) */
  highlights?: {
    field: string; // 'title', 'content', etc.
    snippet: string;
  }[];
}

// 検索結果アイテム（記事＋検索コンテキスト）
interface ArticleSearchResultItemDto {
  article: ArticleMetadataDto; // 記事データ本体
  search: ArticleSearchMetaDto; // 検索関連データ
}

// レスポンス
interface ArticleSearchResultListDto {
  items: ArticleSearchResultItemDto[];
  totalCount: number;
  // ファセット等はここに追加
}
```
