# Architecture Decision: Database-First Content Application (v4: JSONB Hybrid)

## 1. 変更点 (Changelog)
- **Previous:** Normalized `sections` table (Joined query required).
- **Current:** **JSONB Hybrid Structure.**
- **Reason:** Performance (No JOINs for fetch), Flexibility (Schema-less content blocks), and AI Friendliness (Structured JSON manipulation).

---

## 2. アーキテクチャ: JSONB Content Strategy

「完全な正規化(SQL)」と「ドキュメント指向(NoSQL)」のいいとこ取りを行います。
翻訳テーブル内に **JSONBカラム** を配置し、そこにセクション構造を格納します。

### 2.1 Schema Design
正規化された翻訳テーブル(`xxx_translations`)に、構造化データを埋め込みます。

- **`work_translations`**
  - `work_id` (FK)
  - `lang` (PK)
  - `title` (Text)
  - **`content_structure` (JSONB)**: `[{ "type": "text", ... }, { "type": "score", ... }]`

### 2.2 Merits
1.  **Single Select:** `WHERE id = ? AND lang = ?` の1クエリで、記事の全構成要素が取得可能。
2.  **AI Partial Update:** アプリ側でJSONをパースし、特定IDのブロックだけ書き換えてUPDATEすることが容易。
3.  **Search Performance:** 全文検索用には別途 `content_index` (tsvector) カラムを用意し、JSONBへの重い検索クエリを回避する。

---

## 3. Performance Strategy

### 3.1 Fetch & Cache (ISR)
ユーザーのアクセスパスにおけるDB負荷をゼロにします。

1.  **Edit Time:** Admin UIがDB(JSONB)更新 -> `last_updated_at` 更新。
2.  **Build Time (ISR):** Next.jsがDBからJSONを取得 -> HTMLレンダリング -> Edge Cache。
3.  **Read Time:** User -> Edge Cache (Fast).

### 3.2 Search Optimization
JSONBの中身を検索するのではなく、保存時に生成された `tsvector` カラムを検索します。
- **Write:** JSONB更新 -> トリガー/アプリが `tsvector` を更新。
- **Read:** 検索クエリは `tsvector` インデックスのみを走査。

---

## 4. 結論
**「個人開発の運用効率」** と **「世界規模の配信パフォーマンス」** を両立するため、**JSONB Column Pattern** を採用します。
