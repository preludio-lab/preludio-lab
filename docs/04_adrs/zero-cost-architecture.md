# Zero Cost Architecture

Date: 2025-12-15

## Status

Accepted

## Context

PreludioLabは個人開発プロジェクトであり、継続的な運営のためには固定費（ランニングコスト）を極限まで下げる必要があります。
一般的なWebアプリケーション構成（VPS, Managed DB, AI API Subscription）では、月額数千円〜数万円のコストが発生し、収益化前のプロジェクトにとっては大きな負担となります。

## Decision

ドメイン代（年額）を除くすべてのインフラ・サービスにおいて、**「Free Tier（無料枠）」の範囲内で完結するアーキテクチャ**を採用します。

*   **Hosting:** Vercel Hobby Plan
*   **Database:** Supabase Free Tier
*   **AI:** Google AI Studio (Gemini) Free Tier
*   **Compute:** GitHub Actions (Standard Runners)

## Consequences

### Positive
*   **Sustainability:** 収益がゼロでもプロジェクトを永続的に維持できる。
*   **Simplicity:** コスト管理の複雑さが排除され、開発に集中できる。

### Negative
*   **Limits:** 各サービスの制限（Cold Start, Rate Limits, Storage Caps）を厳密に考慮した設計が必要。
*   **SLA:** 無料枠には保証（SLA）がない場合が多く、ダウンタイムや予告なき仕様変更のリスクを受け入れる必要がある。
