# Article Application Layer

Article（記事）ドメインのアプリケーション層の実装詳細およびユースケースとDTOのマッピング定義です。

## Directory Structure

- `dto/`: データ転送用オブジェクト (Data Transfer Objects)
- `usecase/`: ユースケース実装 (Application Business Rules)

## Use Case to DTO Mapping

ユースケースの実装ファイルと、入出力に使用するDTOのマッピングです。
ファイル名をベースに記載しています。

### Query (Read)

データの取得・参照系ユースケースです。

| Use Case File (`.usecase.ts`) | Description                            | Input (Criteria/Args)      | Output DTO                                |
| :---------------------------- | :------------------------------------- | :------------------------- | :---------------------------------------- | ----- |
| **`list-articles`**           | 記事一覧の取得（管理画面・ブログ一覧） | `ArticleSearchCriteria`    | `PagedResponse`<br>`<ArticleListItemDto>` |
| **`get-article-by-slug`**     | 記事詳細の取得（本文含む）             | `lang`, `category`, `slug` | `ArticleDto                               | null` |
| **`get-latest-articles`**     | 新着記事の取得（Discover, Top等）      | `GetLatestArticlesInput`   | `ArticleCardDto[]`                        |
| **`get-featured-articles`**   | おすすめ記事の取得                     | `lang`, `limit`            | `PagedResponse`<br>`<ArticleCardDto>`     |
| **`get-related-articles`**    | 関連記事・レコメンド取得               | `GetRelatedArticlesInput`  | `ArticleCardDto[]`                        |
| **`search-articles`**         | 記事の検索（全文検索・ベクトル検索）   | `ArticleSearchCriteria`    | `ArticleSearchResultListDto`              |

### Command (Write)

データの作成・更新・削除系ユースケースです。

| Use Case File (`.usecase.ts`) | Description    | Input (Criteria/Args) | Output DTO            |
| :---------------------------- | :------------- | :-------------------- | :-------------------- |
| **`create-article`**          | 記事の新規作成 | `CreateArticleInput`  | `ArticleReferenceDto` |
| **`update-article`**          | 記事の更新     | `UpdateArticleInput`  | `void`                |
| **`delete-article`**          | 記事の削除     | `slug`                | `void`                |
| **`increment-view-count`**    | PV数の加算     | `slug`                | `void`                |

## DTO Definitions

`src/application/article/dto/` 配下のDTO定義ファイルとその用途です。

### `article-list.dto.ts`

一覧表示系・カードコンポーネント用。

- **`ArticleCardDto`**: 一般ユーザー向け UI（カード表示）用。
- **`ArticleListItemDto`**: 管理リスト用。

### `article-detail.dto.ts`

詳細表示用。

- **`ArticleDto`**: 記事の全データ（本文含む）。

### `article-search.dto.ts`

検索機能用。

- **`ArticleSearchResultListDto`**: 検索メタデータを含む結果リスト。

## Architecture Note

- DTO は `Clean Architecture` の方針に従い、Domain 層の `ArticleSchema` (Zod) をベースに、用途に合わせて `pick`/`extend` して定義されています。
- 詳細は `docs/05_design/` 配下のアーキテクチャ設計書を参照してください。
