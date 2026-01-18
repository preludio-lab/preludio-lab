# Storage & CDN Design (Cloudflare R2)

本ドキュメントは、Cloudflare R2およびCDNを用いたストレージ構成と、アセット配信のアーキテクチャを定義します。

## 1. アーキテクチャ概要 (Architecture Concept)

**「Zero-Cost Architecture」** に基づき、Vercelの帯域制限（Hobby Plan: 100GB）を回避しつつ、最高のパフォーマンスを実現するためのハイブリッド配信構成を採用します。

### Architecture: Source to Cache Mapping

R2上のディレクトリ区分と、それぞれの配信・キャッシュを担うレイヤーの対応関係は以下の通りです。

| Source Directory | Delivery / Cache Layer  | Content Type      | Description                                                                                                                       |
| :--------------- | :---------------------- | :---------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| **`R2/public`**  | **Cloudflare CDN**      | **Static Assets** | 画像、譜例、無料音源など。<br>Cloudflare Worker経由でR2から直接配信され、Cloudflareエッジでキャッシュされます。                   |
| **`R2/private`** | **Vercel Edge Network** | **MDX**           | MDX原稿など。<br>Next.js (Vercel) が内部的に取得・レンダリングし、生成成果物（HTML/JSON）としてVercelエッジでキャッシュされます。 |

### Data Flow Strategy

#### 1. HTML配信 (`R2/private` source)

- **Cache Hit (Normal):**
  `User` -> `Cloudflare CDN (DNS)` -> **`Vercel Edge (Return Cached HTML)`**
  _(高速。Vercel Edgeから即座にレスポンス)_

- **Cache Miss / Revalidation (Origin Fetch):**
  `User` -> `Cloudflare CDN` -> `Vercel Edge` -> **`Next.js App (SSR/Build)`** -> **`R2/private (S3 API)`**
  _(Next.jsがAWS SDK等を用いて直接MDXを取得しHTMLを生成します。**Cloudflare Workerは経由しません**)_

#### 2. 静的アセット配信 (`R2/public` source)

- **Cache Hit (Normal):**
  `User` -> **`Cloudflare CDN (Return Cached Asset)`**
  _(最速。Cloudflareエッジから即座にレスポンス)_

- **Cache Miss (Origin Fetch):**
  `User` -> `Cloudflare CDN` -> `Cloudflare Worker` -> **`R2/public (Fetch Object)`**
  _(R2からオブジェクトを取得し、Cloudflare CDNにキャッシュしてレスポンス)_

---

## 2. 物理リソース定義 (Resource Definition)

- **Platform:** Cloudflare R2
- **Bucket Name:** `preludiolab-storage`
- **Region:** `Auto` (Global Distribution)
- **Access Policy:**
  - **Public Access:** Disabled (Block all direct access)
  - **Worker Access:** Allowed (via Bindings)
  - **App Access:** Allowed (via S3 Compatible API + Secret Key)

---

## 3. ディレクトリ構造 (Directory Structure)

記事Slug（`works/bach/prelude-1` 等）をキーとした階層構造を採用し、アセット管理の一貫性を保ちます。

```
preludio-storage/
├── public/                 # CDN経由で公開
│   ├── works/              # ドメイン: 作品 (共有リソース)
│   │   └── {composer}/{work}/{part?}/
│   │       ├── audio/              # 音源
│   │       │   ├── full.mp3
│   │       │   └── ...
│   │       └── musical-examples/   # 譜例SVG
│   │           ├── ex1.svg
│   │           └── ...
│   ├── articles/           # ドメイン: 記事 (編集リソース)
│   │   └── {category}/{slug}/
│   │       └── images/             # 記事固有の画像
│   │           ├── thumbnail.webp
│   │           └── ...
│   └── composers/          # ドメイン: 作曲家
│       └── {slug}/
│           └── images/             # ポートレート等
│               └── portrait.webp
└── private/                # 外部アクセス不可 (Next.js App Only)
    ├── articles/           # 原稿データ
    │   └── {category}/{slug}/
    │       └── mdx/        # MDXコンテンツ
    │           ├── ja.mdx
    │           ├── en.mdx
    │           └── ...
```

---

## 4. 公開アセットの配信仕様 (Public Assets)

### URL Schema

Cloudflare Workerにより、R2の `public` ディレクトリをドメイン直下にマッピングして配信します。
アセットタイプではなく**ドメイン（コンテキスト）**でルートを分離し、データの一貫性と再利用性を高めます。

- **Base URL:** `https://cdn.preludiolab.com`
- **Path Mapping:** `/*` -> `R2: public/*`

| Context      | Public URL Example                              | R2 Path (under `public/`)                      | Description                  |
| :----------- | :---------------------------------------------- | :--------------------------------------------- | :--------------------------- |
| **Work**     | `/works/{composer}/{work}/audio/full.mp3`       | `works/{composer}/{work}/audio/full.mp3`       | 作品に紐づく普遍的なリソース |
| **Article**  | `/articles/{category}/{slug}/images/thumb.webp` | `articles/{category}/{slug}/images/thumb.webp` | 記事コンテンツ固有のリソース |
| **Composer** | `/composers/{slug}/images/portrait.webp`        | `composers/{slug}/images/portrait.webp`        | 作曲家固有のリソース         |

### Access Control (Worker Logic)

### Worker Implementation Logic

Cloudflare Workerにて以下の高度な制御を行います。

1.  **Scope Restriction & Sanitization (Security):**
    - `public/` 配下のオブジェクトのみ参照を許可。
    - パストラバーサル攻撃（`..` を含むパス）を厳密に検知・ブロックする。
2.  **Audio Range Requests:**
    - ブラウザのシークバー対応のため、`Range` ヘッダーを透過的に処理し、部分コンテンツ（206 Partial Content）を返却する（`worktop` 等のライブラリや標準APIを活用）。
3.  **Content-Type Enforcement:**
    - `musical-examples/*.svg` に対しては `Content-Type: image/svg+xml` を強制し、インライン表示トラブルを防ぐ。
4.  **Security Headers:**
    - 以下のヘッダーを付与し、セキュリティを強化する。
      - `X-Content-Type-Options: nosniff`
      - `Access-Control-Allow-Origin: https://preludiolab.com` (CORS)
      - `Cross-Origin-Resource-Policy: same-site`
5.  **Cache Control:**
    - `Cache-Control: public, max-age=31536000, immutable` を付与。

### Image Optimization Strategy (Zero-Cost Resizing)

Cloudflareの有料Image Resizingを使用しないため、ビルド時またはアップロード時に **Pre-generation（事前生成）** を行う戦略を採用します。

- **Naming Schema:**
  - `thumbnail.webp` (Original / Large for OGP)
  - `thumbnail-sm.webp` (Small for List View / 300px width)
- **Responsive Logic:**
  - `next/image` の `loader` または `<picture>` タグを使用し、デバイス幅に応じて適切なサフィックスの画像をリクエストする。

---

## 5. 内部データの取扱仕様 (Private Data)

### MDX Articles

- **Path:** `private/articles/{category}/{slug}/{lang}.mdx`
- **Purpose:** Next.jsアプリケーションのビルド（SSG/ISR）および検索インデックス構築の「原稿（Source of Truth）」として使用。
- **Sync Flow:**
  1.  執筆（Local/CMS）
  2.  マイグレーションスクリプト実行
  3.  DB (`articles` table) 更新 + R2 (`private/articles`) アップロード

### Paid Content (Future)

-将来的に「有料会員限定の高音質音源」などを提供する場合、`private/paid-audio/` 等に配置する。

- 配信時は、Next.jsのAPI Route経由でストリーミングするか、期限付き署名URL（Signed URL）を発行してアクセスさせる。

---

## 6. ファイル命名規則 (Naming Conventions)

- **Slug:** URLセーフな小文字英数字とハイフンのみ (`^[a-z0-9-]+$`)。
- **Images:**
  - サムネイル: `thumbnail.webp` (Large), `thumbnail-sm.webp` (Small)

  - 汎用画像: `fig{N}.webp` 等。
  - **Optimization:** 原則として **WebP** 形式を採用し、ファイルサイズを削減する。Braswer互換性のため必要であればJPG/PNGを併用するが、現代の主要ブラウザはWebPをサポートしているためWebPメインとする。

- **Audio:**
  - フォーマット: MP3 (128kbps~192kbps for Web), AAC等。Web最適化されたエンコード推奨。

---

## 7. 開発・デプロイ構造 (Project & Deployment Structure)

Workerを独立したコンポーネントとして管理するため、プロジェクトルート直下の `workers/` ディレクトリに配置します。

### Directory Layout

```text
/ (Project Root)
├── workers/
│   └── cdn-proxy/
│       ├── src/
│       │   └── index.ts  # Workerメインコード (Hono)
│       ├── package.json  # Worker依存関係 (独立)
│       ├── tsconfig.json
│       └── wrangler.toml # Worker設定 (R2 Binding等)
├── src/ (Next.js App)
│   ├── app/
│   ├── domain/
│   └── ...
└── package.json (Next.js用)
```

### 独立構成のメリット (Architectural Benefits)

Next.jsアプリ側に同梱せず独立させることで、**Zero-Cost Architecture** の要である「コストとパフォーマンスの最適化」を最大化します。

1.  **デプロイ単位の分離 (Decoupled Deployment)**:
    - Workerは Cloudflare (`wrangler`)、Next.jsは Vercel と、デプロイサイクルや環境変数を完全に独立させることができます。キャッシュ戦略の微調整程度でNext.js全体の再ビルドは不要です。
2.  **依存関係の最小化 (Minimized Dependencies)**:
    - Worker側にはHono等の軽量ライブラリのみを含め、Next.jsの重いエコシステムを排除することで、エッジでの起動（Cold Start）を最速に保ちます。
3.  **責務の明確な分離 (Separation of Concerns)**:
    - Next.jsアプリは「Webアプリケーション（UI/UX, 楽曲メタデータ管理）」としての責務に集中し、Workerは「インフラ層（静的アセットの最適配信Proxy）」としての責務に特化させます。これにより、Vercelの帯域制限やEdge Functionの制限を回避しつつ、セキュアで高速なアセット配信を実現します。
