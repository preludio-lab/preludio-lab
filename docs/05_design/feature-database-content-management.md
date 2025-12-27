# データベースコンテンツ管理システム設計書 (feature-database-content-management.md)

## 1. 概要
本ドキュメントは、MDXコンテンツをマスタデータ（Source of Truth）とし、データベースをサーチ・インデックスおよびメタデータ管理用として活用するための「ハイブリッド・コンテンツ管理システム」の仕様を定義します。

## 2. Hybrid Content Model
Gitで管理されるMDXファイルと、パフォーマンス・検索性に優れたデータベースの役割を明確に分け、同期させます。

### 2.1 役割分担
- **MDX (File System):**
  - **Single Source of Truth.** 全てのコンテンツ（本文、フロントマター）の正本。
  - バージョン管理、PRベースの編集・レビュー。
- **Database (PostgreSQL):**
  - **ReadOnly Index.** MDXから抽出されたメタデータの保持。
  - 高速なフィルタリング、ソート、セグメンテーション。
  - 全文検索 (FTS) およびセマンティック検索 (pgvector)。

### 2.2 同期フロー (Sync Pipeline)
MDXの変更がマージされた際、または開発者の手動実行により、以下のフローでDBを更新します。

1. **Scan:** `content/**/*.mdx` を走査。
2. **Parse:** `gray-matter` でフロントマターを抽出し、Markdown本文をプレーンテキストに変換。
3. **Upsert:** `slug` と `lang` をユニークキーとして `works` / `composers` テーブルへデータを更新。
4. **Embed:** 必要に応じてGemini APIを呼び出し、記事内容のベクトル表現（Embedding）を `content_embeddings` テーブルに保存。

## 3. 検索仕様
データベースの検索機能を活用し、従来のファイルベース検索では困難だった高度な検索を実現します。

### 3.1 検索エンジンの構成
- **全文検索 (Full Text Search):** PostgreSQLの `to_tsvector` を使用したキーワードマッチング。
- **ベクトル検索 (Vector Search):** `pgvector` を使用し、キーワードが一致しなくても「意味が近い」コンテンツを抽出。
- **ハイブリッド検索:** FTSとベクトル検索の結果を重み付けして統合。

### 3.2 検索フィルタ
- 言語 (`lang`)
- 作曲家 (`composer_name`)
- 難易度 (`difficulty`)
- カテゴリ/タグ (`tags`)

## 4. テーブル設計概要
詳細は `docs/05_design/data-schema.md` を参照してください。
- `composers`: 作曲家メタデータ
- `works`: 楽曲・譜例メタデータ
- `content_embeddings`: 検索用ベクトルデータ
