# データベースコンテンツ管理システム設計書 (feature-database-content-management.md)

## 1. 概要
本ドキュメントは、**Supabase Database** をコンテンツの正本（Source of Truth）とし、AIエージェントによる効率的な制作・管理を行う「Database-First Content Application」の仕様を定義します。
Gitは、DBデータの「バックアップ」および「静的サイト生成(SSG)ソース」として位置付けます。

## 2. 前提条件と制約 (Constraints)
- **Supabase Database:** 500MB Free Limit (Master).
- **GitHub:** Output Target for Backup & Build.
- **Scale:** 70,000 Articles (Granular Sections).

## 3. Database-First Configuration

### 3.1 Data Source Roles & Persistence Matrix

「専用管理画面（Admin View）」を前提とし、**全てのコンテンツ（メタデータ・本文・多言語）の正本を RDBMS (Supabase) に集約します。**
GitHubはあくまで「生成された結果の出力先」として扱います。

| 管理対象 (Item) | Master Source **(RDBMS)** | Backup / Build Source **(GitHub)** |
| :--- | :---: | :---: |
| **Metadata (JA - Master)** | ✅ **Primary (Edit here)** | 🔄 Generated (Read-Only) |
| **Body (JA - Master)** | ✅ **Primary (Edit here)** | 🔄 Generated (Read-Only) |
| **Metadata (Translations)** | ✅ **Primary (Edit here)** | 🔄 Generated (Read-Only) |
| **Body (Translations)** | ✅ **Primary (Edit here)** | 🔄 Generated (Read-Only) |

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

## 5. 多言語対応戦略 (Internationalization Strategy)

「世界最高峰のデータベース設計」として、**Normalized Translation Pattern (正規化された翻訳パターン)** を採用します。
「普遍的な事実（Universal Facts）」と「言語固有の表現（Localized Content）」をテーブルレベルで物理的に分離し、保守性と拡張性を最大化します。

### 5.1 アーキテクチャ原則
- **Separation of Concerns:** 
  - `works` (Universal): 作曲年、作品番号、調性など、言語に依存しない事実は1箇所で管理。
  - `work_translations` (Localized): タイトル、解説、要約など、言語ごとに変化する情報は翻訳テーブルで管理。
- **Scalability:** 言語数が増えてもカラム追加（`title_ja`, `title_en`...）は不要。レコード追加のみで対応可能。

### 5.2 Translation Table Pattern
すべてのマスタデータおよびコンテンツデータに対して、対となる `_translations` テーブルを定義します。

- **Master Entity:** `id`, `slug` (Canonical), `universal_attributes`...
- **Translation Entity:** `entity_id` (FK), `lang` (ISO code), `localized_attributes`...

これにより、「翻訳抜けの検知」や「AIへの特定言語のみの生成指示」がクエリレベルで極めて容易になります。

## 6. 検索仕様
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
