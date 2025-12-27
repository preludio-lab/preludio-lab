# Architecture Decision: High-Scalability Content System for 70k Items

## 1. 課題定義と前提条件 (Constraints & Goals)

### 前提条件 (Constraints)
- **Zero Cost Compliance:**
  - Supabase DB Storage: < 500MB
  - GitHub Repo Storage: < 500MB (Soft Limit), 1GB (Hard Limit)
  - GitHub Actions: < 2,000 min/mo
- **Scale:** 70,000 Articles (10,000 Works x 7 Languages)

### 達成すべきゴール (Goals)
1. **Performance:** ビルド時間、描画時間の短縮。検索の高速化。
2. **Quality:** AIハルシネーションの防止、バリデーション遵守。
3. **Productivity:** コンテンツ大量生産パイプラインの確立。

---

## 2. アーキテクチャ比較・評価マトリクス

### 2.1. Master Data Strategy: GitHub vs Database

| 観点 | **Option A: GitHub Master (MDX)** | Option B: Database Master (Headless CMS) |
| :--- | :--- | :--- |
| **品質 (Review)** | ◎ **Pull Requestによる差分レビューが可能。** AIの嘘を防ぐ唯一の手段。 | × DB直接更新のため、変更履歴の可視化とレビューが困難。 |
| **コスト (Storage)** | ○ テキストベースなら70k件でも数GB程度（Git LFSなし）。 | △ Supabase 500MB制限に抵触する可能性大（全文保存の場合）。 |
| **生産性 (AI)** | ◎ 既存LLMツールと親和性が高い（File生成）。 | ○ API経由での投入は容易だが、修正フローが複雑化。 |
| **ビルド性能** | △ ファイルIOが発生。全件ビルドは現実的でない。 | ◎ DBから必要な分だけFetch可能。ISRと相性良し。 |

**判定:** **Option A (GitHub Master)** を採用。
**理由:** 「品質（レビュー可能性）」が最優先事項であり、これを犠牲にできない。ビルド性能課題は後述の **"Hybrid ISR"** で解決する。

---

### 2.2. Rendering & Build Strategy (Performance)

70,000記事を `next build` で静的生成(SSG)することは、CI時間制限(2000分)およびVercelのビルド時間制限(45分)により**不可能**。

| 戦略 | 概要 | 判定 |
| :--- | :--- | :--- |
| **Full SSG** | 全7万ページをビルド時に生成。 | × **ビルドタイムアウト確実。** 採用不可。 |
| **SSR** | リクエスト毎にサーバーレンダリング。 | △ Vercel Functions実行時間制限とDB接続レイテンシが懸念。遅い。 |
| **Hybrid ISR** | **Top 1000件のみSSG + 残りはOn-demand ISR。** | ◎ **採用。** ビルド時間は一定（数分）。ロングテールは初回のみ生成遅延があるが、CDNキャッシュされる。 |

**[採用戦略: Hybrid ISR Strategy]**
- `generateStaticParams`: 主要な1,000記事のみを返す。
- その他: `fallback: 'blocking'` または `true` とし、初回アクセス時に生成してキャッシュする。
- **メリット:** ビルド時間が記事数に依存せず一定になる。

---

### 2.3. Search Index Strategy (Cost & Storage)

Supabase Free Tier (500MB) に70,000件のデータをどう収めるか。
(想定: 1記事あたり本文平均 5KB と仮定 -> 350MB。インデックス含めると500MB超過のリスク大)

| 戦略 | データ構成 | ストレージ予測 | 検索精度 | 判定 |
| :--- | :--- | :--- | :--- | :--- |
| **Full Text Index** | 全文(Raw) + `tsvector` + Vector | **> 1GB** (Over Limit) | ◎ 最高 | × 不可 |
| **Summary Index** | **概要(300文字) + Meta + Vector** | **~100MB** (Safe) | ○ 良好 | ◎ **採用** |
| **External Index** | Algolia / Meilisearch (Self-host) | 別途コスト発生 | ◎ | × Zero Cost違反 |

**[採用戦略: Summary-based Indexing]**
- **DB保存対象:**
  - `slug`, `title`, `composer`, `tags` (メタデータ)
  - `summary` (AI生成された要約テキスト)
  - `embedding` (要約のベクトル化)
- **検索体験:**
  - ユーザーは「概要」と「メタデータ」で検索する。
  - 全文検索（本文の隅々まで）は諦めるトレードオフを受け入れる（またはクライアントサイド検索 `Pagefind` を併用する）。

---

### 2.4. Synchronization Workflow (Productivity)

CI時間 (2000分/月) を守るための同期戦略。

- **差分更新 (Differential Sync):**
  - PRマージ時、`git diff --name-only` で変更されたMDXファイル（例えば10件）のみを特定。
  - その10件のみをパースし、DBへUpsert。
  - **効果:** 処理時間は数秒〜数十秒。全件スキャン（数分）を回避。

---

## 3. 結論: 最適なアーキテクチャ構成

### Cost & Quality & Performance Optimization Model

1.  **Repository:** GitHub (MDX Master) - **Review & Version Control**
    - 画像アセットは外部 (R2/YouTube) へ。Repoはテキストのみ。
2.  **Database:** Supabase (Metadata & Summary Index) - **Search & Filter**
    - 本文は保存しない。要約とメタデータのみ保存し500MBに収める。
3.  **Build:** Hybrid ISR (Top 1000 SSG + On-demand ISR) - **Fast Build**
    - 7万記事あってもビルド時間は増加しない。
4.  **Sync:** Event-driven Differential Sync - **CI Efficiency**
    - 変更分のみ同期し、Actions消費を最小化。

この構成により、提示された全ての制約（Zero Cost, 500MB, 2000min）をクリアしつつ、品質と生産性を最大化します。
