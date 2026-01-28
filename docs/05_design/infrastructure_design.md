# インフラ設計書 & 設定定義

## 概要 (Overview)

「Zero Cost Architecture」に基づき、各種SaaSの Free Tier（無料枠）を最大限活用する構成とします。
本ドキュメントは、実際の環境設定値と運用戦略を定義します。

## 1. 環境定義 (Environment Definitions)

アプリケーション、データベース、AIエージェントの各コンポーネントにおける環境分離戦略を定義します。

| 環境 (Environment) | アプリケーション (App)                     | データベース (DB)                                        | AIエージェント (Agent Runner)                  | 用途・特徴                                                 |
| :----------------- | :----------------------------------------- | :------------------------------------------------------- | :--------------------------------------------- | :--------------------------------------------------------- |
| **Development**    | **Local PC**<br>`localhost:3000`           | **Supabase (Staging)**<br>_Cloud Staging or Shared Prod_ | **Local PC**<br>_手動実行_                     | 機能開発、単体テスト。Cloud DBを参照し、環境差異を減らす。 |
| **Staging**        | **Vercel Preview**<br>`git-branch-url`     | **Supabase (Staging)**<br>_Cloud Staging or Shared Prod_ | **GitHub Actions**<br>_Pull Request Trigger_   | ステージング相当。本番またはStaging DBを参照。             |
| **Production**     | **Vercel Production**<br>`preludiolab.com` | **Supabase (Production)**<br>_本番データ_                | **GitHub Actions**<br>_Schedule / API Trigger_ | 本番稼働環境。エンドユーザー向け公開。                     |

---

## 2. ホスティング (Vercel)

アプリケーション（Next.js）のホスティングには **Vercel** を使用します。

### プロジェクト設定

- **Platform:** Vercel (Hobby Plan)
- **Project Name:** `preludio-lab`
- **Region (Function):** `Washington, D.C., USA (iad1)`

### 環境変数 (Environment Variables)

- `NEXT_PUBLIC_SUPABASE_URL` / `ANON_KEY`
- `SUPABASE_DB_PASSWORD` (Prod Only)

### セキュリティ対策 (Security Measures)

- **DDoS Protection:** Vercel標準のDDoS緩和措置を利用。
- **HTTPS Enforcement:** 常時SSL/TLS化（HSTS自動適用）。
- **Environment Variables:** 機密情報はVercel Dashboardで暗号化保管し、コードには含めない。

---

## 3. DNS (Cloudflare)

ドメイン管理およびDNSには **Cloudflare** を使用します。

### 設定

- **Production Domain:** `preludiolab.com`
- **DNS Records:** A/CNAME to `Vercel IP` (Proxy Status: **Proxied / Orange Cloud**)
  - ※Vercel公式は "DNS Only" を推奨するが、帯域コスト削減のため **Proxy Mode** を採用する。

### [REQ-INFRA-CLOUDFLARE] Page Rules Configuration

VercelのISRと共存させるため、キャッシュルールを厳格に分離する。

1.  **Rule 1: Static Assets (Cache Everything)**
    - **URL:** `*.preludiolab.com/_next/static/*`
    - **Setting:** `Cache Level: Cache Everything`, `Edge Cache TTL: 1 Year`
    - **Purpose:** 帯域を大量に消費するJS/CSS/FontをCloudflareで完全にキャッシュし、Vercelの帯域を守る。
2.  **Rule 2: HTML Pages (Bypass / Standard)**
    - **URL:** `*.preludiolab.com/*`
    - **Setting:** `Cache Level: Standard` (Respect Origin Headers)
    - **Purpose:** HTMLのキャッシュ制御はVercel (Origin) に一任する。これにより、ISRによる記事更新が即座に反映されない問題を回避する。

### セキュリティ対策 (Security Measures)

- **Account Security:** Cloudflareアカウントへの **2要素認証 (2FA)** を必須化。
- **DNSSEC:** ドメインレジストラ側でDNSSECを有効化し、DNSキャッシュポイズニングを防止（必要に応じて）。

---

## 4. Hybrid CDN Strategy (Asset & HTML Delivery)

**Cloudflare CDN (Assets)** と **Vercel Edge Network (HTML)** の強みを組み合わせた2層構造（Hybrid Strategy）を採用し、コストゼロで最高のパフォーマンスを実現します。

### 4.1 Cloudflare CDN (Public Assets: Image & Audio)

静的アセット（画像、音源、譜例）の配信を担当します。

#### Architecture

- **Origin:** Cloudflare R2 (`preludiolab-storage`)
- **Proxy:** Cloudflare Worker (`cdn-proxy`)
- **Domain:** `cdn.preludiolab.com`

#### [REQ-INFRA-AUDIO-OPT] Audio Streaming (Range Requests)

- **課題:** 長時間の音源（MP3）をスムーズにシーク再生する。
- **解決策:** Workerが `Range` ヘッダーを解釈し、R2から必要なバイト範囲のみを `206 Partial Content` として返却します。ブラウザはこれを認識し、シークバー操作時に必要な断片のみをダウンロードします。

#### [REQ-INFRA-IMG-OPT] Image Optimization (Pre-generation Strategy)

- **課題:** モバイル端末でのLCP改善と、Cloudflare有料リサイズ機能の回避。
- **解決策:** 以下の「ゼロコスト・プレ生成戦略」を採用します。
  - **閾値 (Breakpoint):** `640px`
  - **配信パスの切り替え:**
    - `width <= 640`: サフィックス `-sm` を付与（例: `portrait-sm.webp`）
    - `width > 640`: オリジナル画像を配信（例: `portrait.webp`）
    - **SVG:** ベクターデータのため常にオリジナルを配信。
  - **運用:** アセット配置時に自動的に縮小版を生成します。

#### Security & Cache Headers

- **Access Control:** `Access-Control-Allow-Origin` を以下に限定。
  - Production: `preludiolab.com`, `www.preludiolab.com`
  - Preview: `*.preludiolab*.vercel.app` (Regex: `.*preludiolab.*`) - プロジェクト名を含むVercelプレビューURLを許可
  - Local: `localhost`
- **Cache Strategy:** `Cache-Control: public, max-age=31536000, immutable` (1年間キャッシュ)

---

### 4.2 Vercel Edge Network (HTML & RSC Payload)

動的コンテンツ（HTML, RSC Payload）の配信を担当します。

#### Architecture

- **Origin:** Next.js App (Serverless Functions)
- **Domain:** `preludiolab.com`

#### Strategy

- **ISR (Incremental Static Regeneration):**
  - 記事HTMLはVercel Edgeでキャッシュされ (`stale-while-revalidate`)、バックグラウンドで再生成されます。
- **Cache Bypass (Cloudflare Side):**
  - Cloudflare側ではHTMLをキャッシュせずバイパスし (`Cache Level: Standard`)、Vercel側のISR制御を妨害しない構成とします。

---

## 5. オブジェクトストレージ (Cloudflare R2)

アセット本体の格納には **Cloudflare R2** を使用し、Vercelの帯域制限（Hobby: 100GB）を完全に回避します。

### バケット構成

- **Bucket Name:** `preludiolab-storage`
- **Region:** `auto` (Global)
- **Path structure:**
  - `public/works/{composer}/{work}/audio/` (音源)
  - `public/works/{composer}/{work}/musical-examples/` (譜例)
  - `public/articles/{slug}/images/` (記事内画像)
  - `private/` (Next.js アプリケーションからのみSDK経由でアクセスするMDX本文など)

---

## 6. データベース (Supabase)

### 設定

- **Region:** `US East (N. Virginia)`
- **Auth Mode:** **SSO Only** (Email/Password Disabled)
- **Environment:** Single DB (Prod)

### セキュリティ対策 (Security Measures)

- **RLS (Row Level Security):** 全テーブルでRLSを有効化し、認証に基づいた厳格なアクセス制御を行う（**最重要**）。
- **Data API Security:** 不要なスキーマ公開を防ぐため、Public SchemaのみをExpose対象とする。
- **Backup Strategy (Free Tier Limitation):**
  - **Limitation:** Supabase Free Tierには、任意の時点に戻せるPITRや、UIからの簡単リストア機能は**含まれない**（運営への依頼が必要、日数もかかる）。
  - **Self-Managed Backup:**
    1.  **Seed Data:** 復旧可能なマスタデータはGit管理する。
    2.  **pg_dump:** (Option) GitHub Actions定期実行により、主要データをダンプして外部ストレージ（Artifacts等）に退避するフローを検討する。

### [REQ-INFRA-DB-SEARCH] Search Infrastructure (Tiered Hybrid)

**Pagefind (Tier 1)** と **Supabase Hybrid Search (Tier 2)** を併用し、速度と網羅性を両立する。

- **Extensions:**
  - `vector`: AI Embeddings (Gemini) の格納・検索用。
  - `pg_trgm` / `fuzzystrmatch`: 曖昧検索用（必要に応じて）。
- **Index Structure:**
  - **`embeddings` table:** `(content_id, vector, language)` を保持し、HNSWインデックスで高速化する。
  - **`metadata` table:** フィルタリング用（時代、楽器、作曲家）。
- **Performance:** 10万件規模でも `rpc` 呼び出しにより 100ms 以内の応答速度を維持する。

---

## 6. デプロイメントパイプライン

### CI/CD Flow

1.  **Pull Request:** `feat/*` -> GitHub Actions (Test) -> Vercel Preview (Auto Deploy)
2.  **Merge:** Merge `master` -> Vercel Production (Build Skipped)
    - _Setting:_ Vercel Dashboard > Settings > Git > Production Branch > **"Auto-deploy" Disabled**
3.  **Release:** Manual Promotion -> Vercel Production (Live)
    - _Action:_ Vercel Dashboard > Deployments > (Select Commit) > **"Promote to Production"**

### 詳細手順: 本番自動デプロイの無効化 (Plan A)

ローンチ前および安全な運用のため、以下の設定を適用します。

1.  **Vercel Dashboard** にアクセスし、プロジェクト (`preludio-lab`) を開く。
2.  **Settings** タブをクリック。
3.  左メニューから **Git** を選択。
4.  **Ignored Build Step** セクションを探す。
5.  Behavior のドロップダウンから **"Only build pre-production"** を選択する。
    - **意味:** プレビュー環境（PR/Branch）のみビルドし、本番環境（Production）のビルドはスキップします。
    - **本番デプロイ方法:** 手動で `vercel --prod` を実行するか、Dashboardからプレビューデプロイを選択して "Promote to Production" を実行します。

### セキュリティ対策 (Security Measures)

- **Branch Protection:** `master` ブランチへの直接Pushを禁止し、必ずPRとCI通過を必須とする（GitHub設定）。
- **Secrets Scanning:** GitHubへの誤ったシークレット混入を防ぐため、ローカルで `git-secrets` 等の導入を推奨。
- **Least Privilege:** CI/CD用のアクセストークンは、必要最小限の権限（Repo Scope等）でのみ発行する。

---

## 7. 可観測性と監視 (Observability & Monitoring)

アプリケーションの健全性とエラーをプロアクティブに監視します（[REQ-TECH-STACK-012]準拠）。

### 監視ツールスタック

- **Access / Speed:** **Vercel Analytics** & **Speed Insights**
  - Web Vitals (LCP, CLS, INP) の継続的な計測。
  - リアルタイムのアクセス解析（Privacy-friendly）。
- **Error Tracking:** **Sentry** (Free Tier)
  - フロントエンドおよびAPIルートでの未処理例外（Exception）の捕捉。
  - リリースごとの不具合発生率の可視化。
- **Database Health:** **Supabase Dashboard**
  - CPU/RAM使用率、ディスク容量、スロークエリの監視。

---

## 8. クォータ管理と制限 (Quota & Cost Management) (Free Tier)

Hobby Plan (Free Tier) の制限内で運用するための管理指針です。

### Vercel (Hobby Plan)

- **Bandwidth:** 100GB / month
- **Serverless Function:** 10s timeout / 1,000,000 invocations
  - _対策:_ 重い処理は Edge Functions または GitHub Actions (Agent) へオフロードする。

### Supabase (Free Tier)

- **Database Size:** 500MB
  - _対策:_ 画像などのバイナリはDBに入れず、必ず Object Storage または外部ホスティング（YouTube等）を利用する。
- **Active Projects:** 2 projects maximum
  - _対策:_ Prod/Devの2環境構成までとし、それ以上はDockerを利用する。
  - _対策:_ 定期的なCronジョブまたはアクセスにより稼働を維持する。

---

## 9. 有料コンテンツ配信戦略 (Tier 3 Performance Optimization)

SSR (Server-Side Rendering) による有料記事（Tier 3）のパフォーマンス劣化を防ぎ、プレミアムなユーザー体験を維持するための戦略定義。

### 9.1 Streaming & Suspense (Partial Rendering)

ページ全体をSSRで待機させるのではなく、**「ガワ（Shell）」**と**「中身（Content）」**を分離して配信します。

- **Static Shell (Instant):** ヘッダー、サイドバー、ローディングスケルトン等は `layout.tsx` レベルでキャッシュまたは静的生成し、即座に表示します。
- **Streaming Content (Async):** 権限チェックが必要な本文コンポーネントのみを `<Suspense>` でラップし、非同期に読み込みます。
  - これにより、TTFB（最初の1バイト）の遅延を隠蔽し、体感速度を向上させます。

### 9.2 Edge Runtime for Auth

認証および権限チェックのオーバーヘッドを最小化します。

- **Edge Runtime:** 認証ミドルウェアおよびAPIルートには **Edge Runtime** を採用し、ユーザーに近いロケーションで実行させます。
- **JWT Verification:** Supabase Authのセッション検証は、DB問い合わせを行わず、Edge上での **JWT検証**（署名チェック）のみで完結させます。

### 9.3 R2 Access Optimization

Cloudflare R2へのアクセス遅延を最小化します。

- **Location:** Vercel (US East) と Cloudflare R2 のデータセンター間のレイテンシは極めて低いため、SSR時のボトルネックとはなりません。
- **Mechanism:** SSRサーバー（Next.js）がAWS SDKを使用して **Private Bucket** からMDXを取得し、レンダリングして返却します。
