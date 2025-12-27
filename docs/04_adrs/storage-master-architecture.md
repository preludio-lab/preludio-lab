# Architecture Decision: High-Scalability Content System for 70k Items (v2)

## 1. 変更点 (Changelog)
- **Problem:** GitHub Repo + Local clone が70,000ファイルに対応しきれない（操作性、容量）。
- **Solution:** **Supabase Storage (Object Storage)** をマスターデータ置き場（Source of Truth）とするアーキテクチャに変更。

---

## 2. 課題定義と前提条件 (Constraints & Goals)

### 前提条件 (Constraints)
- **Zero Cost Compliance:**
  - Supabase Database: < 500MB (厳格)
  - **Supabase Storage (Object):** **1GB** (Free Tier Standard Limit) <- **[KEY] This is separate from DB limit.**
  - GitHub Repo Storage: Keep minimal (Code only).
- **Scale:** 70,000 Articles (10,000 Works x 7 Languages).

---

## 3. アーキテクチャ比較・評価マトリクス (Revised)

### 3.1. Master Data Strategy: GitHub vs Object Storage

| 観点 | Option A: GitHub Master | **Option C: Supabase Storage Master (Object)** |
| :--- | :--- | :--- |
| **容量 (Capacity)** | × 70k filesはGit歴史肥大化により不安定化。 | ◎ **1GBまで無料。** MDXテキスト(350MB)なら余裕。 |
| **ローカル負荷** | × `git clone` で全ファイル落ちてくる。重い。 | ◎ コードのみClone。コンテンツはクラウドにある。 |
| **品質 (Review)** | ◎ GitHub PRで差分レビュー可能。 | △ **Admin UIが必要。** (Agent -> Draft -> Review -> Publishフローを実装) |
| **全文検索** | × 不可 | △ DB側インデックスに依存（後述）。 |

**判定:** **Option C (Supabase Storage Master)** を採用。
**理由:** 「ローカル/GitHub容量の限界」を突破し、かつ「Zero Cost」を守れる唯一の解。
(※Cloudflare R2も選択肢だが、stackをSupabaseに統一する方がシンプル)

---

### 3.2. Rendering & Build Strategy (ISR with Remote Fetch)

コンテンツファイルがローカルに存在しないため、ビルドプロセスが変わります。

| 戦略 | 概要 | 判定 |
| :--- | :--- | :--- |
| **Remote Fetch ISR** | `getStaticProps` で **Supabase StorageからMDXをFetch** してレンダリング。 | ◎ **採用。** 全件DLせず、必要なページのみFetchするため高速。 |

**[採用戦略: Remote Hybrid ISR]**
1. **Access:** User -> Next.js Page (ISR)
2. **Fetch:** Server -> **Supabase Storage (Download MDX)**
3. **Parse & Render:** Server -> HTML + Client JSON
4. **Cache:** CDN Cache (Vercel)

---

### 3.3. Database Indexing (Metadata Only)

Supabase **Database** (500MB) は「検索インデックス」に特化させます。

- **Objects (Storage):** `works/bach/prelude.mdx` (Raw Text) -> **1GB Limit**
- **Rows (Database):** `id`, `slug`, `title`, `summary`, `tags`, `vectors` -> **500MB Limit**

これにより、StorageとDatabaseの無料枠を最大限効率的に使い分けます。

---

### 3.4. Edit & Review Workflow (The "CMS" Problem)

Gitを離れるため、Pull Requestベースのレビューができなくなります。代わりの品質管理フローを定義します。

**[New Workflow: Headless CMS Flow]**
1. **Draft (AI Agent):** Agentがコンテンツを生成し、Supabase Storageの `_drafts/` フォルダにUpload。
2. **Review (Human):** 管理画面 (Admin App) でDraft一覧を確認。MDXをプレビュー。
3. **Publish:** 承認ボタン押下 -> `_drafts/` から `public/` フォルダへ移動 (Move) + DBインデックス更新 (Edge Function trigger)。

---

## 4. 結論: Final Architecture

### "Storage-First" Headless Architecture

1.  **Repository (GitHub):** **Code Only.** コンテンツファイルは含まない。軽量。
2.  **Master Storage (Supabase Storage):**
    - `bucket: content`
    - `path: public/{lang}/{slug}.mdx` (Published)
    - `path: drafts/{lang}/{slug}.mdx` (In-Review)
    - **Capacity:** ~350MB / 1GB Free. (OK)
3.  **Search Index (Supabase DB):**
    - Metadata, Summary, Vectors.
    - **Capacity:** ~200MB / 500MB Free. (OK)
4.  **Frontend (Next.js):**
    - `getStaticProps` でStorageからMDXを取得しレンダリング。
    - **Hybrid ISR** でビルド時間を一定化。

この構成により、**「70,000記事のスケーラビリティ」「Zero Cost」「ローカル環境の軽量化」** を全て達成します。
