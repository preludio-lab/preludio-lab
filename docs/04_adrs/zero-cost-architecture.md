# ADR: Zero-Cost Polyglot Architecture

- **Status:** Accepted
- **Date:** 2025-12-31 (Integrated)
- **Tags:** #architecture, #zero-cost, #polyglot-persistence

## Context (背景)

PreludioLabは個人開発プロジェクトであり、継続的な運営のためには固定費（ランニングコスト）を極限まで下げる必要があります。
「世界最高のクラシック音楽サイト」を目指す上で、70,000記事（7言語）規模のデータセットを扱うインフラを、ドメイン代を除く全てのサービスにおいて **「Free Tier（無料枠）」** の範囲内で完結させることが目標です。

しかし、単一のデータベース（Supabase Free Tier）では容量（500MB）が不足し、逆に容量の大きいDB（Turso/D1）単体ではセキュリティ要件（RLS）や開発効率を満たすことが困難であるというジレンマがありました。

| ソリューション      | 容量            | セキュリティ (RLS)  | 課題                                   |
| :------------------ | :-------------- | :------------------ | :------------------------------------- |
| **Supabase** (Free) | 500 MB (不足)   | ✅ Native           | コンテンツを全部入れると即パンク       |
| **Turso** (Free)    | **9 GB** (十分) | ❌ None (App Layer) | ユーザー権限管理の実装コスト大         |
| **Cloudflare**      | Egress無料      | -                   | メディア配信に最適だがDB機能は発展途上 |

## Decision (決定)

**適材適所の「Polyglot Persistence（多言語永続化）」戦略を採用し、各サービスの無料枠の強みを最大化する。**

### Architecture Overview

| Layer                 | Service            | Role                                                | Free Tier Limit |
| :-------------------- | :----------------- | :-------------------------------------------------- | :-------------- |
| **Identity & Core**   | **Supabase**       | ユーザー認証 (GoTrue)、ユーザー基本情報、課金データ | 500 MB (十分)   |
| **Content Warehouse** | **Turso**          | 記事本文、翻訳データ、メタデータ、**ベクトル検索**  | **9 GB** (十分) |
| **Asset Delivery**    | **Cloudflare R2**  | 画像、音声ファイル、MDX生データ                     | Egress $0       |
| **Compute**           | **GitHub Actions** | AIエージェント実行、CI/CD                           | 2,000 min/month |

### 実装戦略

1.  **Security Bridge (Application-Layer RLS):**
    - TursoにはRLSがないため、データアクセスは必ず Next.js の **Server Actions / API Route** を経由させる。
    - API内でまず Supabase Auth の JWT を検証し、ロールを確認した上で、Turso へのクエリを発行する。
2.  **Vector Search:**
    - Turso のネイティブベクトル検索機能 (`libsql-vector`) を採用し、コンテンツと同じDBで管理する。
3.  **Tiered Caching:**
    - 公開済みコンテンツはエッジ（Vercel Edge Network）でキャッシュし、DB負荷とネットワーク遅延を最小化する。

## Consequences (結果)

### Positive (メリット)

- **True Zero Cost:** 70,000記事×7言語のデータを完全に月額$0で運用可能。
- **Scalability:** 記事数が10倍になっても余裕のある9GBの容量を確保。
- **Optimization:** 各サービスが得意な領域（Supabase=Auth, Turso=Storage, Cloudflare=CDN）に特化。

### Negative (デメリット)

- **Complexity:** 複数のDBへの接続管理、整合性（ユーザー削除時の連動等）をアプリ側で担保する必要がある。
- **Development Cost:** 初期の実装工数は増大するが、長期的なランニングコスト削減のメリットが上回る。
