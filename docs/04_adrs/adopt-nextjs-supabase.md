# Adopt Next.js and Supabase

Date: 2025-12-15

## Status

Accepted

## Context

PreludioLabプロジェクトは、個人開発者とAIエージェントの協業によって「高品質な音楽コンテンツ」を大量生産・管理することを目指しています。
この目標に対し、以下の要件を満たす技術スタックを選定する必要がありました。

1.  **High Productivity:** 個人開発であるため、ボイラープレートを減らし、開発効率を最大化したい。
2.  **Type Safety:** AIエージェントがコードを生成・修正する際、型による制約で品質を担保したい。
3.  **Scalability & Cost:** 初期コストを抑えつつ（Zero Cost Philosophy）、アクセス増にも耐えうるスケーラビリティが欲しい。
4.  **Content Management:** MDXなどのリッチコンテンツを柔軟に扱いたい。

## Decision

以下の技術スタックを採用することを決定しました。

- **Framework:** Next.js (App Router)
- **Database / Auth:** Supabase (PostgreSQL)
- **Hosting:** Vercel

## Consequences

### Positive (メリット)

- **Unified Type System:** TypeScriptを中心としたフルスタック開発が可能。Supabaseの型生成機能により、DBスキーマからTypeScript型を自動生成でき、整合性を保ちやすい。
- **Server Components:** React Server Components (RSC) により、セキュアにDBへアクセスでき、クライアントへのJS転送量を削減できる。
- **Zero Config Deployment:** VercelとNext.jsの親和性が高く、インフラ構築の手間がほぼゼロになる。

### Negative (デメリット / トレードオフ)

- **Vendor Lock-in:** Vercel固有の機能（Vercel Functions, Edge Middleware）に依存するため、他のホスティング（AWS, Google Cloud）への移行コストが高くなる。
  - _Mitigation:_ ビジネスロジックをフレームワークから分離（Clean Architecture）することで、将来的な移行リスクを低減する。
- **Complexity:** App RouterやRSCは比較的新しい概念であり、学習コスト（およびAIへのコンテキスト共有コスト）が発生する。
