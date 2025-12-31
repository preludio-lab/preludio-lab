# 技術選定書: データベース基盤 (Database Technology Selection)

## 1. 比較検討の背景
「世界最高のクラシック音楽サイト」を目指す PreludioLab において、70,000記事（7言語）規模のデータを扱うための最適なデータベース基盤を選定する。
特に **コスト効率 (Free Tier)** と **機能要件 (Vector Search, RLS)** のバランスを評価基準とする。

## 2. 比較マトリクス

| 評価項目 | **Supabase** (PostgreSQL) | **Turso** (SQLite) | **Cloudflare D1** (SQLite) |
| :--- | :--- | :--- | :--- |
| **無料枠容量** | 500 MB (厳格) | **9 GB** (余裕) | **5 GB** (余裕) |
| **コスト超過時** | Pro Tier ($25/mo) | Scaler Plan ($29/mo) | Paid Plan ($5/mo~) |
| **ベクトル検索** | **`pgvector`** (Native) <br> ✅ 成熟度高、エコシステム大 | **`libsql-vector`** (Native) <br> ⚠️ Beta段階、機能限定的 | **`Vectorize`** (Separate) <br> ⚠️ 別DB管理、整合性維持が困難 |
| **セキュリティ** | **RLS (Native)** <br> ✅ DB層で完全な権限管理 | **App Logic** <br> ⚠️ アプリ層での実装が必要 | **App Logic** <br> ⚠️ アプリ層での実装が必要 |
| **検索機能** | **`pg_trgm`** (Full Text) <br> ✅ 日本語対応強力 | **FTS5** <br> ⚠️ 日本語トークナイズに工夫必要 | **FTS5** <br> ⚠️ 日本語トークナイズに工夫必要 |
| **管理画面** | **Studio** (Excellent) <br> SQL, Table Editor, Auth管理 | CLI main / Simple UI | Dashboard / CLI |
| **開発工数** | **低** (All-in-One) | **中** (Auth/RLS自作) | **高** (分散システム構成) |

## 3. 各選択肢の評価詳細

### 3.1 Turso (SQLite Edge)
*   **メリット:** 9GBという圧倒的な無料枠は魅力。Organization機能によるデータベース分割（Tenant per Userなど）が得意。
*   **デメリット:** CMS/管理画面を作る際、**RLS（行レベルセキュリティ）がない**のが致命的。管理者権限と一般ユーザー権限の振り分けをすべてアプリケーションコード（Next.js側）で書く必要があり、バグによる情報漏洩リスクが高い。「世界最高」の堅牢性を担保するには工数がかかりすぎる。

### 3.2 Cloudflare D1 + Vectorize
*   **メリット:** Egress（転送量）無料。画像や静的アセットが多い場合、トータルコストは最強。
*   **デメリット:** "D1" (リレーショナル) と "Vectorize" (ベクトル) が **物理的に別データベース** となる。記事の更新時に両方の整合性を保つトランザクション管理が非常に複雑になる。開発体験が悪く、バグの温床になりやすい。

### 3.3 Supabase (PostgreSQL) - **RECOMMENDED**
*   **メリット:**
    *   **Secure by Default:** RLSにより、「下書き記事は本人と管理者しか見えない」といったロジックをDB層で保証できる。
    *   **Unified:** メタデータ、全文検索、ベクトル検索が1つのSQLで完結する（JOIN可能）。
    *   **Ecosystem:** 認証（GoTrue）、ストレージ、Edge Functionsが統合されており、開発速度が最速。
*   **デメリット:** 無料枠が小さい (500MB)。
*   **解決策:** 規模拡大時は素直に Pro Tier ($25) を払う。エンジニアの時給（工数）を考えれば、セキュリティ実装やバグ取りにかかる時間コストより $25 のほうが圧倒的に安上がりである。

## 4. 最終提言: "Hybrid Best-of-Breed Strategy"

**「Supabase Pro を核とし、Cloudflare を配信に使う」** 構成が、品質とコストのバランスにおける最適解である。

1.  **Core Database: Supabase (PostgreSQL)**
    *   **役割:** 記事メタデータ、ベクトル検索、ユーザー認証、権限管理 (RLS)。
    *   **理由:** 複雑な検索要件とセキュリティ要件を、最も低い開発工数で満たせるため。
    *   **コスト:** 初期Free → 拡大期 Pro ($25/mo)。

2.  **Asset Storage: Cloudflare R2 + CDN**
    *   **役割:** MDX本文ファイル、画像、音声データ。
    *   **理由:** 転送量（Egress）がゼロ円であるため。Supabase Storageは転送量課金があるため、大容量メディアには不向き。
    *   **連携:** Supabase DBには `R2 Public URL` のみを文字列として保存する。

3.  **App Hosting: Vercel (Current)**
    *   **役割:** Next.js アプリケーションホスティング。

### 結論
**「DB容量のためにセキュリティと開発効率（RLS, Integrated Vector）を犠牲にしてTurso選ぶべきではない」**。
Supabaseの堅牢な機能を使い倒し、将来的な $25 のコストは「世界最高の品質」への必要投資と捉えるべきである。
