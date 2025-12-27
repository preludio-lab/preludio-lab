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

### 2.2 Scalability Target & Decisions
- **Volume:** 70,000 Articles (10,000 Works x 7 Languages).
- **Goal:** Cost < Free Tier limit, Performance < 200ms Search, Build Time < Const.

## 3. High-Scalability Architecture Strategy
7万記事規模をZero Costで運用するための確定アーキテクチャ。

### 3.1 Storage Strategy (Summary-based Indexing)
Supabase (500MB) の容量制限を遵守するため、**DBにはMDX全文を保存しません。**
- **Summary Only:** AIにより生成された「要約 (Summary, ~300chars)」と「メタデータ」のみをDBに保存します。
- **Vector Optimization:** ベクトルデータも要約に対して生成し、容量を節約します。

### 3.2 Build Strategy (Hybrid ISR)
全件SSGはCI時間を超過するため採用不可。**Hybrid ISR** を採用します。
- **Top 1,000 SSG:** アクセス数の多い主要1,000記事のみビルド時に静的生成。
- **On-demand ISR:** 残りのロングテール記事は、初回アクセス時に生成（`fallback: blocking`）し、CDNキャッシュさせます。
- **Benefit:** 記事数が増えてもビルド時間は一定に保たれます。

### 3.3 Synchronization (Differential Sync)
- **Git Diff:** `git diff --name-only` を使用し、変更差分のみを検出してDB更新・Embedding生成を行います。
- **CI Cost:** 全件スキャンを回避し、CI実行時間を数秒〜数分に抑えます。

### 3.4 Assets
- **Externalization:** 画像ファイルはGitリポジトリに含めず、外部ストレージ (Cloudflare R2, YouTube, etc.) を参照します。

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
