# Project Technical Requirements Definition (v1.5)

**Status:** Draft (Free Tier Edition). 
**Date:** December 2025.  

## 1. Core Philosophy
* **Zero Cost Architecture:** ドメイン代以外の固定費を**完全にゼロ**にする。
* **Serverless & Stateless:** 常時稼働するサーバーや有料のマネージドサービス（Vertex AI Agent Builder等）は使用しない。
* **API Free Tier Strategy:** AIの頭脳には **Google AI Studio (Gemini API)** の無料枠を活用し、レートリミット（回数制限）内で稼働する設計とする。
* **Google Native:** Googleのエコシステム（Gemini, YouTube, Search）を最大活用する。

## 2. Technology Stack

| Requirement ID | Category | Technology | Selection Reason / Policy |
| :--- | :--- | :--- | :--- |
| **REQ-TECH-STACK-001** | **Frontend** | **Next.js 15 (App Router)** | パフォーマンス、SEO、Vercelとの親和性を重視。 |
| **REQ-TECH-STACK-002** | **Language** | **TypeScript** | 型安全性により、AIによるコード生成の精度と保守性を向上。 |
| **REQ-TECH-STACK-003** | **Hosting** | **Vercel + Cloudflare** | **Hybrid CDN.** Vercel (HTML/ISR) + Cloudflare (Assets/Security) の役割分担でコストゼロと高性能を両立。 |
| **REQ-TECH-STACK-004** | **Content Mgt** | **GitHub (Master) + Supabase (Index)** | MDXはGitで管理し、メタデータ/ベクトルはSupabaseに同期するハイブリッド構成。 |
| **REQ-TECH-STACK-005** | **User DB / Auth** | **Supabase** | **(Free Tier & SSO Only)** メール/パスワード認証は無効化。OAuth連携のみ使用。 |
| **REQ-TECH-STACK-006** | **Search** | **Supabase Hybrid Search** | 全文検索(FTS)とベクトル検索(Embedding)のハイブリッド。セマンティック検索を実現。 |
| **REQ-TECH-STACK-007** | **Media (Score)** | **react-abc / verovio** | API不要のクライアント描画。**SSR不可**のため `useEffect` での制御を必須とする。 |
| **REQ-TECH-STACK-008** | **Media (Audio)** | **YouTube IFrame API** | 外部プレーヤー制御。コストゼロで音源再生。 |
| **REQ-TECH-STACK-009** | **AI Model** | **Gemini 3.0** | **Google AI Studio API**経由で利用。無料枠（Free Tier）を使用。 |
| **REQ-TECH-STACK-010** | **Agent Runner** | **GitHub Actions** | **(Changed)** AIエージェントの実行環境。Cron定期実行や手動トリガーでスクリプトを起動し、コストゼロで計算リソースを確保。 |
| **REQ-TECH-STACK-011** | **i18n & Fonts** | **next-intl / Google Fonts** | 7言語対応。CJKフォントの最適化読み込み（subsetting）によりCLSを防ぐ。 |
| **REQ-TECH-STACK-012** | **Monitoring** | **Vercel Analytics / GSC / Sentry** | MAU, 滞在時間, SEO順位, エラー検知。Privacy-friendlyかつ無料枠で利用可能。 |
| **REQ-TECH-STACK-013** | **Originals** | **Bandcamp Embed** | オリジナル曲の配信。販売導線（Bandcamp）との統合が容易。 |
| **REQ-TECH-STACK-014** | **Privacy** | **Cookie Consent** | GDPR準拠。YouTube等のThird-party Cookie読み込みを制御する同意バナー。 |

## 3. AI Agent Infrastructure (Free Tier Architecture)

有料のADK/Vertex基盤の代わりに、**「GitHub Actions上でTypeScriptスクリプト（AIエージェント）を走らせる」**方式を採用する。

### Execution Flow
1.  **[REQ-TECH-AGENT-FLOW-001] Trigger:** プロデューサー（あなた）がGitHub Actionsを手動実行、またはスケジュール（Cron）で起動。
2.  **[REQ-TECH-AGENT-FLOW-002] Process:** GitHubのサーバー上でスクリプトが実行され、Google AI Studio API (Gemini) を呼び出してコンテンツを生成。
3.  **[REQ-TECH-AGENT-FLOW-003] Output:** 生成結果をMDXファイルとして保存し、`Pull Request` を自動作成する。

### Agent Implementation (Custom Scripts)
Google Generative AI SDK for Node.js を使用したカスタムスクリプト群として実装。

1.  **[REQ-TECH-AGENT-002] Orchestrator Script:** タスクの管理。Gemini APIのレートリミット（RPM/TPM）を超えないようにリクエスト間隔を制御する「スロットリング機能」を実装。
2.  **[REQ-TECH-AGENT-003] AI Context Injection:**
    *   **課題:** 多言語展開における音楽用語の誤訳（例: Key→鍵、Note→メモ）および理論の嘘を防ぐ。
    *   **実装:** 記事生成・翻訳を行うAIエージェントに対し、「多言語音楽用語辞書（JSON）」および「信頼できる理論ソース」をコンテキストとして注入（RAGまたはSystem Prompt埋め込み）してから実行させるフローを確立する。
3.  **[REQ-TECH-AGENT-004] Musicologist Script:**
    *   楽曲解説生成
    *   ABC記法による楽譜生成
    *   YouTube Data API (Free Quota) を用いた動画検索
4.  **[REQ-TECH-AGENT-005] Translator Script:** (Ref: [REQ-GOAL-003-03])
    *   **Trigger:** `Musicologist` による記事生成PRのマージ（またはドラフト完成）。
    *   **Process:** マスター記事（JA）を読み込み、他6言語（EN/ES/DE/ZH/FR/IT）へ並列翻訳を実行。
    *   **Output:** 各言語ディレクトリにMDXを生成。
5.  **[REQ-TECH-AGENT-006] Validator Script (Quality Gate):**
    *   **Role:** 音楽専門用語の翻訳品質を担保する「AI検閲官」。
    *   **Process:** 翻訳されたMDXを「多言語音楽用語辞書」と照合し、不自然な訳（例: Minor→未成年）を検知して自動修正する。
6.  **[REQ-TECH-AGENT-007] Coder Script:** コンポーネント修正、Lint修正など。
7.  **[REQ-TECH-AGENT-008] Designer Script:** (Ref: [REQ-UI-PROCESS-001])
    *   **Role:** デザインシステム（Tokens/CSS）の構築と保守、およびUI実装の品質管理。
    *   **Tasks:** UIコンポーネントの作成、Tailwind Configの更新、Visual Regression Testingによる見た目の崩れ検知。

## 4. Content & Media Strategy

### Score Strategy (Text-to-Image)
*   **[REQ-TECH-SCORE] Client-Side Score Rendering:**
    *   **Technology:** `abcjs` ライブラリ (クライアントサイドSVGレンダリング)。
    *   **[REQ-TECH-SCORE-01] Performance:** ユーザー離脱を防ぐため、モバイルデバイス（ミッドレンジAndroid）において、クライアントサイドでのレンダリングを **1.5秒以内** に完了させること。
        *   *(Verified 2025-12-17: ~45ms on MVP implementation)*
    *   **[REQ-TECH-SCORE-02] Loading State:** `abcjs` エンジンの初期化およびレンダリング中は、Skeleton UI または低解像度のプレースホルダーを表示すること。
    *   **[REQ-TECH-SCORE-03] Bandwidth Optimization:** Vercelの帯域コストを最小限に抑えるため、レンダリング済み画像（MBサイズ）ではなく、生のABCテキスト（KBサイズ）を転送する。
    *   **[REQ-TECH-SCORE-04] Accessibility:** 生成されるSVGには、`abcjs` がサポートする範囲でアクセシビリティ対応のタイトル・説明を含めること。

### Audio Strategy (YouTube Embed)
*   **[REQ-TECH-STRAT-003] Method:** 公式チャンネルの動画IDと開始時間を指定。
*   **[REQ-TECH-STRAT-004] Ad Policy:** 広告リスクを許容し、UI（スキップボタン等）でUXを緩和。
*   **[REQ-TECH-STRAT-005] Compliance:** YouTube利用規約に準拠。

### Originals Strategy (Portfolio)
* **[REQ-TECH-STRAT-006] Method:** Bandcamp埋め込み、またはSoundCloud埋め込みを利用。
* **[REQ-TECH-STRAT-007] Hosting:** 音源ファイル自体は外部プラットフォームにホストし、サイト負荷を回避する。

### [REQ-TECH-SEO] Technical SEO & Sharing Architecture
検索エンジンからの流入最大化と、SNSでの拡散力強化を技術面から支える。

*   **[REQ-TECH-SEO-001] Sitemap & RSS:** `next-sitemap` 等を使用し、全多言語ページのsitemap.xmlとRSSフィードをビルド時に自動生成する。
*   **[REQ-TECH-SEO-002] Dynamic OGP Generation (Hybrid & Deterministic):** 記事のカテゴリに応じて最適な画像を生成する。
    *   **Logic:** AIによる自動生成ではなく、**Frontmatterの `ogp_excerpt` (検証済みABCコード)** を決定論的にレンダリングする。これにより「誤った譜面が拡散されるリスク」をゼロにする。
    *   **Work/Introduction:** `ogp_excerpt` (譜面) + タイトル。
    *   **Composer/Column:** `thumbnail` (画像) + タイトル。
    *   **Implementation:** `vercel/og` を使用し、Edge Function上でSVG描画を行う。
*   **[REQ-TECH-SEO-003] Structured Data (JSON-LD):** Googleの「Rich Results」に対応するため、`MusicComposition` や `Article` タイプの構造化データを自動埋め込みする。

## 5. Security Architecture

### [REQ-SEC-001] Layer 1: AI Safety & Cost Control
* **[REQ-SEC-001-01] Rate Limiting:** 無料枠の制限を超えないよう、スクリプト側でWait処理を入れる。
* **[REQ-SEC-001-02] Human Verification:** AIは必ず `Pull Request` を作成する。`master` ブランチへの直コミットは禁止。

### [REQ-SEC-002] Layer 2: App Security (General & OWASP Top 10)
アプリケーション全体、特にSupabase利用時におけるセキュリティリスクへの対策。
* **[REQ-SEC-002-01] Broken Access Control (OWASP #1):**
    *   Supabase RLS (Row Level Security) を全テーブルに適用し、「自分のデータのみ読み書き可能」を強制する。
    *   **Reason:** SupabaseはクライアントからDBへ直接アクセスするアーキテクチャであるため、RLSが唯一のファイアウォールとなる（適用しないと全データが公開状態になるリスクがある）。
    *   管理者機能へのアクセスはRBAC (Role-Based Access Control) で厳格に制御する。
* **[REQ-SEC-002-02] Injection (OWASP #3):**
    *   SQL Injection対策: すべてのDB操作はSupabase JS Client（ORMライク）経由で行い、生のSQLは原則禁止とする。
    *   XSS (Cross Site Scripting)対策: React/Next.jsの標準エスケープとContent Security Policy (CSP) を活用する。
* **[REQ-SEC-002-03] Authentication Failures:**
    *   メール/パスワード認証を無効化し、ソーシャルログイン（OAuth）のみを許可することで、パスワード漏洩リスクをゼロにする。

### [REQ-SEC-003] Layer 3: Infra Security & Continuity
攻撃やコスト爆発からサービスを守り、持続可能性を担保する。
*   **[REQ-SEC-003-01] Anti-DDoS:** Vercel Firewall (Automatic Mitigation) および Cloudflare (DNS) の標準機能を活用し、異常なトラフィックスパイクを防御する。
*   **[REQ-SEC-003-02] Cost Explosion Prevention:**
    *   **API Quota:** Gemini APIのリクエスト数をエージェント側で厳格にカウントし、無料枠（Free Tier）の上限に近づいたら処理を停止するCircuit Breakerを実装する。
    *   **Spend Limits:** Vercel / Supabase などの有料課金が発生しうるサービスにおいて、Spend Cap（課金上限）またはアラートを設定する。
*   **[REQ-SEC-003-03] Secrets Management:** Gemini API Key、Supabase Key等の機密情報は **GitHub Secrets** および **Vercel Environment Variables** にのみ保存。コード内には一切含めない。
*   **[REQ-SEC-003-04] Dependabot:** 依存関係の脆弱性を監視。

## 6. DevOps & QA Architecture

### [REQ-DEVOPS-ENV] Environment Definitions
3層のランドスケープ定義により、品質担保と本番安定性を両立する。

| Env ID | Environment | Infrastructure | Access URL | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **REQ-DEVOPS-ENV-001** | **Development** | **Local PC** | `localhost:3000` | 機能開発、単体テスト、AIエージェントの試運転。 |
| **REQ-DEVOPS-ENV-002** | **Verification** | **Vercel Preview** | `*.vercel.app` | **Staging環境。** PR作成時に自動デプロイ。E2Eテスト、UI確認、Lighthouse計測を行う。 |
| **REQ-DEVOPS-ENV-003** | **Production** | **Vercel Production** | `preludiolab.com` | **本番環境。** `master` ブランチと同期。エンドユーザー向け公開。 |

### [REQ-DEVOPS-FLOW] CI/CD Pipeline & Branch Strategy
GitHub Flowをベースに、Verification環境（Preview Deploy）を組み込んだワークフロー。

*   **[REQ-DEVOPS-FLOW-001] Branch Strategy:**
    *   `master`: 本番用ブランチ（常にProductionと同期）。直接コミット禁止。
    *   `feat/*`, `fix/*`: 作業用ブランチ。`master` から派生し、PRを経て `master` へマージ。
*   **[REQ-DEVOPS-FLOW-002] Workflow A: Pull Request (Verification):**
    *   **Trigger:** `master` へのPR作成/更新。
    *   **CI:** Build check, Lint (ESLint), Format (Prettier), Type check (tsc), Unit Test (Vitest) を実行。
    *   **CD (Preview):** Vercel Preview Deployment を自動作成し、Verification環境のURLをPRにコメント通知。
*   **[REQ-DEVOPS-FLOW-003] Workflow B: Production Release:**
    *   **Trigger:** `master` へのマージ (Push)。
    *   **CD (Production):** Vercel Production Deployment を実行し、本番環境 (`preludiolab.com`) を更新。
*   **[REQ-DEVOPS-FLOW-004] Workflow C: Agent Runner:**
    *   **Trigger:** Schedule / Manual Trigger.
    *   **Action:** AIエージェントを実行し、コンテンツ生成PRを作成 (Workflow Aへ接続)。

### [REQ-DEVOPS-RELEASE] Versioning & Rollback Strategy
迅速なロールバックと効果測定を可能にするリリース管理フロー。

*   **[REQ-DEVOPS-RELEASE-001] Semantic Versioning:** アプリケーションコードの改修時（機能追加・バグ修正）にのみ `vX.Y.Z` タグを付与する。単なる記事コンテンツの追加時はバージョン更新を行わない。
*   **[REQ-DEVOPS-RELEASE-002] GitHub Releases:** タグ付与をトリガーに Release Note を自動生成し、含まれる変更点（PRリンク）と当時のKPI期待値を記録する。
*   **[REQ-DEVOPS-RELEASE-003] Instant Rollback:** 万が一の障害時は、`git revert` ではなく **Vercel Instant Rollback** 機能を使用し、1秒で正常な前バージョンへ切り戻す。
    *   ロールバック後、改めて `hotfix` ブランチで修正を行い、バージョンを上げて再デプロイする。
*   **[REQ-DEVOPS-RELEASE-004] Performance Baseline:** 各リリース（Deployment）に対し、Vercel Analytics の "Deployment Score" (Web Vitals) を記録し、バージョン間の性能劣化を監視する。

### [REQ-DEVOPS-TEST] Testing Strategy
*   **[REQ-DEVOPS-TEST-001] Unit Testing:** `Vitest` を使用。Domain/Application層、およびServer Actionsのバリデーションを検証。
*   **[REQ-DEVOPS-TEST-002] Client Component Testing:** `React Testing Library` を使用。Wrapper PatternにおけるRenderer（UIロジック）の振る舞いを検証する。
*   **[REQ-DEVOPS-TEST-003] E2E Testing:** `Playwright` を使用。Server Components (Pages) の表示や重要導線（閲覧、検索、ログイン）の回帰テストを実行。

## 7. Non-Functional Requirements (SaaS Native)
SaaSの標準機能を最大限活用し、追加開発コストをかけずに非機能要件を担保する。

### [REQ-NFR-001] Availability & Scalability
*   **[REQ-NFR-001-01] Uptime:** VercelおよびSupabaseのSLA/SLOに準拠する（目標稼働率 99.9%）。
*   **[REQ-NFR-001-02] Auto Scaling:** スパイクアクセス時はVercel Functionsの自動スケーリングにより処理する。サーバーのプロビジョニングは行わない。

### [REQ-NFR-002] Performance
*   **[REQ-NFR-002-01] Core Web Vitals:** Googleの提唱する指標（LCP, CLS, INP）において、モバイル/デスクトップ共に "Good" (緑) スコアを維持する。
*   **[REQ-NFR-002-02] Hybrid Edge Caching:**
    *   **Static Assets:** 画像、フォント、楽譜SVGは **Cloudflare (Cache Everything)** で1年間キャッシュし、帯域コストをゼロにする。
    *   **HTML (ISR):** Next.jsのISR整合性を保つため、HTML配信は **Vercel Edge** に任せ、Cloudflare側ではHTMLをキャッシュしない（バイパスする）。
*   **[REQ-NFR-002-03] User Perceived Latency:**
    *   **Page Transition:** ページ遷移ごとの反応速度を 200ms 以内とする（SPA/Soft Navigationの利点を活かす）。
    *   **Score Rendering:** クライアントサイドでの楽譜描画完了時間を **1.5秒以内 (Mobile)** に抑え、待機中はSkeleton UIを表示して離脱を防ぐ。

### [REQ-NFR-003] Data Integrity & Backup
*   **[REQ-NFR-003-01] Content as Code:** 記事、画像のマスターデータは全てGitHubリポジトリで管理し、**「Gitが唯一の正解（Source of Truth）」**となる状態を維持する。これにより、DB障害時の復旧（Disaster Recovery）をgit cloneのみで可能にする。
*   **[REQ-NFR-003-02] User Data (Best Effort):** Supabase Free Tierの標準バックアップ機能（Daily）に依存する。ユーザーデータ（お気に入り等）は「消失してもサービス提供自体は継続可能」な区分とし、過剰な冗長化コストをかけない。

### [REQ-NFR-004] Fault Tolerance
*   **[REQ-NFR-004-01] Graceful Degradation:** 外部API（YouTube, Gemini）の障害時は、エラーページではなく「代替表示（リンク表示やキャッシュ済みデータ）」を行い、サイト全体の停止を防ぐ。

### [REQ-NFR-005] Volume & Limits
想定されるデータ量とアクセス規模に対し、性能劣化を起こさない設計とする。
*   **[REQ-NFR-005-01] Traffic Volume:** ビジネス要件 [REQ-GOAL-001-01] にある **100万人/月 (MAU)** のアクセスに耐えうるアーキテクチャとする（Vercel CDN / Serverless Functionsの自動スケールにより担保）。
*   **[REQ-NFR-005-02] Content Volume:** 記事数が **1,000件** を超えても、以下の性能を維持する。
    *   **Search:** Supabase Hybrid Search (Vector + FTS) により、数十万件規模でも高速なクエリ応答を実現する。
    *   **Build:** **Hybrid ISR Strategy** を採用。
        *   **Top 500:** アクセスの多い主要コンテンツのみビルド時に静的生成（SSG）。
        *   **Others:** ロングテールコンテンツはリクエスト時に生成（ISR）し、Vercel Edge Networkにキャッシュする。これによりビルド時間制限（45分）を回避する。
    *   **Navigation:** `generateStaticParams` をDBクエリで最適化し、動的ルーティングを高速化する。