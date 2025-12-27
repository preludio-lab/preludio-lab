# データベースコンテンツ管理システム設計書 (feature-database-content-management.md)

## 1. 概要
本ドキュメントは、MDXコンテンツをマスタデータ（Source of Truth）とし、データベースをサーチ・インデックスおよびメタデータ管理用として活用するための「ハイブリッド・コンテンツ管理システム」の仕様を定義します。

## 2. 前提条件と制約 (Constraints)
本システムは個人開発における「Zero Cost Architecture」を前提とし、以下のSaaS無料枠の制限内で、エンタープライズレベルのデータ量（70,000記事＝10,000楽曲×7言語）を扱う設計とします。

### 2.1 SaaS Free Tier Limits
- **Supabase (Database):**
  - **Storage:** 500MB Limit.
  - **Impact:** 7万記事の全文テキストとベクトルデータをそのまま格納すると容量超過のリスクがある。
- **GitHub (Repo & CI):**
  - **Storage:** 500MB (Recommended soft limit).
  - **Actions:** 2,000 minutes/month.
  - **Impact:** 毎回全件ビルド・全件同期を行うとCI時間を食い潰す。

### 2.2 Scalability Target
- **Volume:** 70,000 Contents (10k Works x 7 Langs).
- **Performance:** 検索応答速度 < 200ms, ビルド時間内の収束。

## 3. Hybrid Content Model & Architecture Strategy
上記の制約をクリアするため、以下の戦略を採用します。

### 3.1 Storage Optimization (Supabase 500MB対策)
DBは「正本」ではなく「検索インデックス」であるため、保存データを極限まで軽量化します。
- **No Raw Text in DB:** `content_text` (MDX本文) はDBに保存せず、検索用の `tsvector` (PostgreSQL全文検索インデックス) のみを生成・保存するアプローチを検討、または検索対象を「概要 (Summary/Intro)」に限定します。
- **Vector Quantization:** Embeddingデータは容量を圧迫するため、重要コンテンツ（Introductionなど）に限定するか、将来的に圧縮手法（ハーフプレシジョン等）を適用します。

### 3.2 Incremental Sync (GitHub Actions 2000分対策)
- **Differential Sync:** `sync-supabase.ts` は、GitのDiff情報（`git diff --name-only`）を利用し、**「変更があったMDXのみ」** をDBに同期します。
- **Cached Build:** Next.jsのISR (Incremental Static Regeneration) を活用し、変更がないページの再ビルドを回避します。

### 3.3 Asset Externalization (GitHub 500MB対策)
- **Images:** リポジトリには含めず、**Cloudflare R2** などの外部ストレージ、またはYouTube/WikiCommons等の外部URLを参照する設計とし、Gitリポジトリを軽量（テキストのみ）に保ちます。

## 4. Hybrid Content Model (Role Definition)

### 4.1 役割分担
- **MDX (File System):**
  - **Single Source of Truth.** 全てのコンテンツ（本文、フロントマター）の正本。
  - バージョン管理、PRベースの編集・レビュー。
- **Database (PostgreSQL):**
  - **ReadOnly Index.** MDXから抽出されたメタデータの保持。
  - 高速なフィルタリング、ソート、セグメンテーション。
  - 全文検索 (FTS) およびセマンティック検索 (pgvector)。

### 4.2 マスターデータ管理戦略の比較検討 (Comparison)
プロジェクトの特性（個人開発、AIエージェント活用、音楽理論コンテンツ）を踏まえ、マスターデータの置き場所について比較・選定を行います。

| 比較項目 | **Option A: GitHub (File System) Master** [推奨] | Option B: Database Master (Headless CMS) |
| :--- | :--- | :--- |
| **信頼できる情報源** | Gitリポジトリ (MDX Files) | PostgreSQL Database |
| **AI生成フロー** | エージェントがPRを作成 → **Diff機能で人間がレビュー** → マージ | エージェントがAPIで直接DB更新 → 即時反映（レビュー困難） |
| **品質担保 (QA)** | 楽曲解説の「ハルシネーション」をPRレビューで防げる。 | 不正なデータが混入した場合、検知とロールバックが難しい。 |
| **表現力** | MDX内でReactコンポーネント (`<ScoreRenderer />`) を自由に配置可能。 | DB内のテキストをパースしてコンポーネント展開する処理が複雑・脆弱。 |
| **バックアップ** | `git clone` だけで全コンテンツ復元可能 (Disaster Recovery)。 | DBダンプと定期バックアップの管理が必要。 |
| **更新の即時性** | デプロイ（または同期スクリプト実行）が必要。 | 変更後即座に反映可能。 |

#### [結論] 推奨案: Option A (GitHub Master)
本プロジェクトでは **「AI生成コンテンツの品質管理（ハルシネーション防止）」** が最重要課題であるため、GitHubのPull Requestフローを強制できる **Option A** を採用します。データベースはあくまで「検索・参照用インデックス」として利用し、正本データとしては扱いません。

### 4.3 同期フロー (Sync Pipeline)
MDXの変更がマージされた際、または開発者の手動実行により、以下のフローでDBを更新します。

1. **Scan:** `content/**/*.mdx` を走査。
2. **Parse:** `gray-matter` でフロントマターを抽出し、Markdown本文をプレーンテキストに変換。
3. **Upsert:** `slug` と `lang` をユニークキーとして `works` / `composers` テーブルへデータを更新。
4. **Embed:** 必要に応じてGemini APIを呼び出し、記事内容のベクトル表現（Embedding）を `content_embeddings` テーブルに保存。

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
