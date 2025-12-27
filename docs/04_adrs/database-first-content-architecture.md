# Architecture Decision: Database-First Content Application (v3)

## 1. 変更点 (Changelog)
- **Previous:** Storage-First (Files in Object Storage) or Git-First.
- **Current:** **Database-First (Supabase DB as Master).**
- **Reason:** AIエージェントによる一括編集・生成、多言語管理、および「コンテンツ制作のアプリケーション化」を推進するため。

---

## 2. 推奨アーキテクチャ: Content as an Application

「静的なファイルを管理する」のではなく、**「コンテンツ制作アプリケーション(Admin)を通してデータをDB管理し、そこからサイトを生成する」** というモデルへ移行します。

### 2.1 Core Concepts
1.  **Source of Truth:** **Supabase Database.** 構造化されたデータ（セクション、楽譜、翻訳）として管理。
2.  **Editor:** **Custom Admin UI (Next.js + AI SDK).** AIと対話しながらコンテンツを作り込む場。
3.  **Build/Backup:** **DB -> Git Sync.** DBの変更をトリガーにMDXを生成し、GitHubへコミット（バックアップ兼SSGソース）。

---

## 3. 詳細設計論点

### 3.1 コンテンツ構造 (Granular Content)
単一の巨大な本文カラムではなく、AIが扱いやすい粒度で分割します。

- **`articles`**: 記事の親レコード (Slug, Title).
- **`sections`**: 記事内の各パート (Order, Heading, Content).
  - AIは「"歴史的背景"セクションだけをリライトして」と指示可能になる。
- **`music_scores`**: 楽譜データ (ABC/MusicXML) を独立管理。
  - 本文からは `{{score:123}}` のようなタグで参照。一括形式変換などが容易になる。

### 3.2 品質管理とコストのバランス
Zero Cost (Supabase 500MB) と品質担保の両立。

| 課題 | 解決策 |
| :--- | :--- |
| **DB容量 (Text)** | 70k記事でもテキストのみなら約350MBで収まる。履歴(Revision)は持たず、Gitへ逃がすことでDBを軽量化。 |
| **DB容量 (Vector)** | 全文のVector化は容量オーバーするため、「要約セクション」のみVector化する。 |
| **品質 (Review)** | Admin UI上に「AI Reviewer」機能を実装。公開前に自動チェック＋人間承認のフェーズを設ける。 |

---

## 4. ワークフロー比較

| Phase | Old (Search Index) | **New (Content App)** |
| :--- | :--- | :--- |
| **Master** | Git / Storage | **Supabase DB** |
| **Edit** | VSCode / File Upload | **Admin UI (AI-Assisted)** |
| **Provision** | Pull Request | **Direct DB Update** |
| **Sync** | Git -> DB | **DB -> Git (Backup)** |

この構成により、ユーザーが目指す「エンタープライズ級の生産性」と「AIとの協働」を最大化します。
