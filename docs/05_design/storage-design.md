# Storage & CDN Design (Cloudflare R2)

本ドキュメントは、Cloudflare R2およびCDNを用いたストレージ構成と、アセット配信のアーキテクチャを定義します。

## 1. アーキテクチャ概要 (Architecture Concept)

**「Zero-Cost Architecture」** に基づき、Vercelの帯域制限（Hobby Plan: 100GB）を回避しつつ、最高のパフォーマンスを実現するためのハイブリッド配信構成を採用します。

### Architecture: Source to Cache Mapping

R2上のディレクトリ区分と、それぞれの配信・キャッシュを担うレイヤーの対応関係は以下の通りです。

| Source Directory | Delivery / Cache Layer | Content Type | Description |
| :--- | :--- | :--- | :--- |
| **`R2/public`** | **Cloudflare CDN** | **Static Assets** | 画像、譜例、無料音源など。<br>Cloudflare Worker経由でR2から直接配信され、Cloudflareエッジでキャッシュされます。 |
| **`R2/private`** | **Vercel Edge Network** | **HTML / RSC** | MDX原稿など。<br>Next.js (Vercel) が内部的に取得・レンダリングし、生成成果物（HTML/JSON）としてVercelエッジでキャッシュされます。 |

### Data Flow Strategy

1.  **HTML配信 (`R2/private` source):**
    - `User` -> `Cloudflare CDN (DNS)` -> **`Vercel Edge (Cache)`** -> `Next.js App` -> **`R2/private`**
    - アプリケーションが `private` 配下のMDXを取得してHTMLを生成。その結果がVercel Edge Networkにキャッシュされます。
2.  **静的アセット配信 (`R2/public` source):**
    - `User` -> **`Cloudflare CDN (Cache)`** -> `Cloudflare Worker` -> **`R2/public`**
    - `public` 配下のファイルは、Vercelを通らずにCloudflare CDNから直接高速配信されます。

---

## 2. 物理リソース定義 (Resource Definition)

- **Platform:** Cloudflare R2
- **Bucket Name:** `preludio-storage`
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
├── public/                 # CDN経由で公開 (Cloudflare Worker -> R2)
│   ├── images/             # 記事画像・サムネイル (Article Unit)
│   │   └── {article_slug}/ # e.g. works/bach/prelude-1
│   │       ├── thumbnail.webp # サムネイル
│   │       ├── fig1.webp
│   │       └── ...
│   ├── musical-examples/   # 譜例SVG (Work Unit)
│   │   └── {work_slug}/    # e.g. works/bach/prelude-1
│   │       ├── ex1.svg
│   │       ├── ex2.svg
│   │       └── ...
│   └── audio/              # 音源ファイル (Article Unit)
│       └── {article_slug}/
│           ├── full.mp3
│           └── ...
└── private/                # 外部アクセス不可 (Next.js App Only)
    ├── articles/           # 原稿データ (Article Unit)
    │   └── {article_slug}/
    │       ├── ja.mdx
    │       ├── en.mdx
    │       └── ...
    └── backups/            # DBダンプ、ログ等
        └── ...
```

---

## 4. 公開アセットの配信仕様 (Public Assets)

### URL Schema

Cloudflare Workerにより、R2の `public` ディレクトリをドメイン直下にマッピングして配信します。URLパスとR2パスを一致させることで、直感的なアクセスを実現します。

- **Base URL:** `https://cdn.preludiolab.com`
- **Path Mapping:** `/*` -> `R2: public/*`

| Asset Type | Public URL Example | R2 Path |
| :--- | :--- | :--- |
| **Thumbnail** | `/images/{article_slug}/thumbnail.webp` | `public/images/{article_slug}/thumbnail.webp` |
| **MusicalExample (SVG)** | `/musical-examples/{work_slug}/ex1.svg` | `public/musical-examples/{work_slug}/ex1.svg` |
| **Audio** | `/audio/{article_slug}/full.mp3` | `public/audio/{article_slug}/full.mp3` |

### Access Control (Worker Logic)

Cloudflare Workerにて以下の制御を行います。

1.  **Scope Restriction:** `public/` 配下のオブジェクトのみ参照を許可する。`private/` へのアクセスリクエストは `403 Forbidden` を返却する。
2.  **Anti-Hotlinking (Optional):** 必要に応じ、`Referer` ヘッダをチェックし、`preludiolab.com` 以外からの直リンクをブロックする（SNS OGP用クローラは許可する設定が必要）。
3.  **Cache Control:** `Cache-Control: public, max-age=31536000, immutable` を付与し、ブラウザおよびCDNで強力にキャッシュさせる。

---

## 5. 内部データの取扱仕様 (Private Data)

### MDX Articles

- **Path:** `private/articles/{article_slug}/{lang}.mdx`
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
  - サムネイル: `thumbnail.webp` (WebP推奨, Fallback to JPG)
  - 汎用画像: `fig{N}.webp` 等。
  - **Optimization:** 原則として **WebP** 形式を採用し、ファイルサイズを削減する。Braswer互換性のため必要であればJPG/PNGを併用するが、現代の主要ブラウザはWebPをサポートしているためWebPメインとする。
- **Audio:**
  - フォーマット: MP3 (128kbps~192kbps for Web), AAC等。Web最適化されたエンコード推奨。
