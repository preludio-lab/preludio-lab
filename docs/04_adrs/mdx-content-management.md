# Git-based Content Management (MDX)

Date: 2025-12-15

## Status

Accepted

## Context

ブログ記事や楽曲解説などのリッチコンテンツを管理する必要があります。
Headless CMS（Contentful, MicroCMS）は便利ですが、無料枠の制限（APIコール数、レコード数）があり、将来的にコスト要因となるリスクがあります。また、楽譜コンポーネントなどを埋め込む柔軟性が求められます。

## Decision

コンテンツ（記事データ）は **MDXファイル** としてGitリポジトリ内で管理する方式を採用します。
Next.jsのビルドプロセスでこれらを解析し、静的ページ（SSG）として生成します。

## Consequences

### Positive
*   **Component Usage:** 記事内でReactコンポーネント（`<ScoreRenderer />`等）を直接利用でき、表現力が高い。
*   **Version Control:** 記事の変更履歴をGitで完全に追跡でき、Pull Requestベースでのレビューが可能。
*   **Zero External Dependency:** CMSサービス終了や値上げのリスクがない。

### Negative
*   **Build Time:** 記事数が増えるとビルド時間が増大する（Incremental Static Regeneration等での対策が必要）。
*   **Search Difficulty:** DBに入っていないため、全文検索の実装には工夫が必要（Pagefindは廃止し、Supabase Hybrid Searchへの移行を決定）。
