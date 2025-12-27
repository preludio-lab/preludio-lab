# データベースコンテンツ管理システム設計書 (feature-database-content-management.md)

## 1. 概要
本ドキュメントは、**Supabase Database** をコンテンツの正本（Source of Truth）とし、AIエージェントによる効率的な制作・管理を行う「Database-First Content Application」の仕様を定義します。
Gitは、DBデータの「バックアップ」および「静的サイト生成(SSG)ソース」として位置付けます。

## 2. 前提条件と制約 (Constraints)
- **Supabase Database:** 500MB Free Limit (Master).
- **GitHub:** Output Target for Backup & Build.
- **Scale:** 70,000 Articles (Granular Sections).

## 3. Database-First Configuration

### 3.1 Data Source Roles
- **Supabase Database (Master):**
  - **Single Source of Truth.**
  - コンテンツを構造化して管理 (`articles`, `sections`, `music_scores`).
  - AIによる一括変換・分析の基盤。
- **GitHub (Backup & Build Source):**
  - **Read-Only Snapshot.**
  - DBからエクスポートされたMDXファイルを保持。
  - Vercelによるビルドで使用。

### 3.2 Workflow: AI-Assisted Admin Flow
1.  **Edit:** 人間/AIがAdmin UI (Next.js) でDBを更新。
2.  **Preview:** Admin UI上でリアルタイムプレビュー (DBデータをレンダリング)。
3.  **Sync:** 変更確定後、非同期プロセスでMDXを生成しGitHubへコミット（バックアップ）。

### 3.3 Editor Stack (Admin UI)
- **Framework:** Next.js (App Router)
- **Editor:** Tiptap / Lexical
- **AI Integration:** Vercel AI SDK (Streaming edits).

## 4. データ構造戦略 (Granular Schema)
AIの作業効率を高めるため、コンテンツを粒度細かく管理します。
詳細は `docs/05_design/data-schema.md` を参照。

- **Articles:** 記事のメタデータ (Slug, Title).
- **Sections:** 見出しごとの本文ブロック。AIの部分編集対象。
- **Music Scores:** 楽譜データを独立管理。

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
