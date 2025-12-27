# データベースコンテンツ管理システム設計書 (feature-database-content-management.md)

## 1. 概要
本ドキュメントは、**Supabase Storage (Object Storage)** をコンテンツの正本（Master）とし、Databaseを検索インデックスとして活用する「Storage-First Headless Content System」の仕様を定義します。
このアーキテクチャにより、Gitリポジトリの軽量化と、SaaS無料枠（Storage 1GB + DB 500MB）の最大活用を実現します。

## 2. 前提条件と制約 (Constraints)
- **Supabase Storage (Object):** 1GB Free Limit. (ここにMDXファイルを格納)
- **Supabase Database:** 500MB Free Limit. (ここにメタデータと要約を格納)
- **GitHub:** Code Only. (コンテンツファイルを含まない)

### 2.2 Scalability Target
- **Volume:** 70,000 Articles (10,000 Works x 7 Languages).
- **Goal:** ローカルPCのディスク圧迫回避、Git操作の高速性維持。

## 3. Storage-First Architecture Strategy

### 3.1 Data Source Roles
- **Supabase Storage (Master):**
  - MDXファイルの物理保存場所。
  - 構成: `bucket: content`
    - `public/`: 公開済みコンテンツ
    - `drafts/`: 承認待ち/作業中コンテンツ
- **Database (Index):**
  - メタデータ、要約、ベクトルデータの保持。
  - フロントエンドからの検索・フィルタリング用。

### 3.2 Workflow: Headless CMS Flow
Git PRの代わりに、管理画面を通じた承認フローを導入します。

1.  **Generate:** AI Agentが `drafts/` フォルダにMDXをアップロード。
2.  **Review:** 人間がAdmin AppでDraftを閲覧・修正。
3.  **Publish:** 承認アクション → ファイルを `public/` へ移動 + DBインデックス更新 (Edge Function)。

### 3.3 Build Strategy (Remote Hybrid ISR)
- **Fetch:** ビルド時/ISR生成時に `supabase.storage.download` でMDXを取得。
- **Cache:** 取得したMDXはNext.jsのData CacheおよびCDNにキャッシュされる。

## 4. Hybrid Content Model (Role Definition)

### 4.1 役割分担 (Revised)
- **Supabase Storage (Object):**
  - **Single Source of Truth.**
  - 容量: 1GB (Free Tier)。350MB程度のテキストデータなら余裕で格納可能。
- **Database (PostgreSQL):**
  - **ReadOnly Index.** Storage上のファイルのメタデータコピー。
  - 容量: 500MB (Free Tier)。要約とメタデータのみで200MB程度に抑える。

### 4.2 マスターデータ管理戦略の決定 (Comparison Result)
ADR `docs/04_adrs/storage-master-architecture.md` に基づき、**Supabase Storage Master** を採用します。
Gitによる管理は廃止し、リポジトリを軽量に保ちます。

### 4.3 Publishing Pipeline
ファイル操作（Upload/Move/Delete）をトリガーに、Supabase Database Webhooks または Edge Functions を使用してDBインデックスを同期します。

1. **Trigger:** `storage.objects` へのINSERT/UPDATE/DELETEイベント (Webhook/Function).
2. **Process:** 変更されたMDXファイルをロードし、フロントマターをパース。
3. **Upsert:** `slug` と `lang` をキーにDBメタデータを更新。
4. **Embed:** 要約テキストに対してVector生成を行い保存。

## 5. 検索仕様
データベースの検索機能を活用し、従来のファイルベース検索では困難だった高度な検索を実現します。

### 5.1 検索エンジンの構成
- **全文検索 (Full Text Search):** PostgreSQLの `to_tsvector` を使用したキーワードマッチング。
- **ベクトル検索 (Vector Search):** `pgvector` を使用し、キーワードが一致しなくても「意味が近い」コンテンツを抽出。
- **ハイブリッド検索:** FTSとベクトル検索の結果を重み付けして統合。

### 5.2 検索フィルタ
- 言語 (`lang`)
- 作曲家 (`composer_name`)
- 難易度 (`difficulty`)
- カテゴリ/タグ (`tags`)

## 6. テーブル設計概要
詳細は `docs/05_design/data-schema.md` を参照してください。
- `composers`: 作曲家メタデータ
- `works`: 楽曲・譜例メタデータ
- `content_embeddings`: 検索用ベクトルデータ
