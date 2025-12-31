# ADR: Zero-Cost Polyglot Architecture

*   **Status:** Accepted
*   **Date:** 2025-12-31
*   **Author:** AI Agent (Antigravity)
*   **Tags:** #architecture, #zero-cost, #polyglot-persistence

## Context (背景)

「世界最高のクラシック音楽サイト」を目指す PreludioLab において、70,000記事（7言語）規模のデータセットを扱うためのインフラ基盤を選定する必要がある。
**「可能な限りランニングコストを抑え、ゼロコストでスケーラブルなビジネスを実現する」** ことが、プロジェクトの核心的な価値提供（インパクト）として定義された。

しかし、単一のデータベース（Supabase Free Tier）では容量（500MB）が不足し、逆に容量の大きいDB（Turso/D1）単体ではセキュリティ要件（RLS）や開発効率を満たすことが困難であるというジレンマがある。

| ソリューション | 容量 | セキュリティ (RLS) | 課題 |
| :--- | :--- | :--- | :--- |
| **Supabase** (Free) | 500 MB (不足) | ✅ Native | コンテンツを全部入れると即パンク |
| **Turso** (Free) | **9 GB** (十分) | ❌ None (App Layer) | ユーザー権限管理の実装コスト大 |
| **Cloudflare** | Egress無料 | - | メディア配信に最適だがDB機能は発展途上 |

## Decision (決定)

**適材適適所の「Polyglot Persistence（多言語永続化）」戦略を採用し、各サービスの無料枠の強みを最大化する。**

### Architecture Overview

| Layer | Service | Role | Free Tier Limit |
| :--- | :--- | :--- | :--- |
| **Identity & Core** | **Supabase** | ユーザー認証 (GoTrue)、ユーザー基本情報、課金データ | 500 MB (十分) |
| **Content Warehouse** | **Turso** | 記事本文、翻訳データ、メタデータ、**ベクトル検索** | **9 GB** (十分) |
| **Asset Delivery** | **Cloudflare R2** | 画像、音声ファイル、MDX生データ | Egress $0 |

### 実装戦略
1.  **Security Bridge (Application-Layer RLS):**
    *   TursoにはRLSがないため、データアクセスは必ず Next.js の **Server Actions / API Route** を経由させる。
    *   API内でまず Supabase Auth の JWT を検証し、ロール（Admin/User）を確認した上で、Turso へのクエリを発行する。
    *   公開データ（`status='published'`）はキャッシュを活用して高速配信する。
2.  **Vector Search:**
    *   Turso のネイティブベクトル検索機能 (`libsql-vector`) を採用する。
    *   これにより、コンテンツとベクトル同じDBに同居させ、データの同期コストを排除する。

## Consequences (結果)

### Positive (メリット)
*   **True Zero Cost:** 70,000記事×7言語（約1GB）のデータを、完全に月額$0で運用可能になる。
*   **Scalability:** Tursoの9GB制限に達するまではコストが発生せず、ビジネスが成長し収益化できるまでインフラコストを遅延できる。
*   **Optimization:** 各サービスが得意な領域（Supabase=Auth, Turso=Storage, Cloudflare=CDN）に特化するため、性能面でも妥協がない。

### Negative (デメリット)
*   **Complexity:** 複数のDBへの接続管理、トランザクションの整合性（ユーザー削除時にTurso側のデータも消す等）をアプリケーションコードで担保する必要がある。
*   **Development Cost:** Supabase単体で完結する場合に比べ、初期の実装工数は増大する。しかし、ランニングコスト削減のメリットがこれを上回ると判断する。
