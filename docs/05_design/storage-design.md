# Storage & CDN Design (Cloudflare R2)

本ドキュメントは、Cloudflare R2およびCDNを用いたストレージ構成と、アセット配信のアーキテクチャを定義します。

## 1. アーキテクチャ概要 (Architecture Concept)

**「Zero-Cost Architecture」** に基づき、Vercelの帯域制限（Hobby Plan: 100GB）を回避しつつ、最高のパフォーマンスを実現するためのハイブリッド配信構成を採用します。

### The "Restaurant" Metaphor

| Component | Role | Metaphor | Description |
| :--- | :--- | :--- | :--- |
| **Cloudflare R2** | **Storage** | **倉庫** | マスターデータ（MDX, 高解像度画像, 音源, SVG）を永続保管する場所。<br>ユーザーは直接立ち入り禁止（Private）。 |
| **Vercel** | **Compute** | **キッチン** | 倉庫(R2)から食材(MDX)を取り出し、調理(レンダリング)してHTMLを生成する場所。 |
| **Cloudflare CDN** | **Edge Cache** | **配膳台** | 完成した料理(HTML)や、そのまま出せるドリンク(画像・音源)をユーザーに届ける場所。<br>キャッシュを活用し、高速に提供する。 |

### Data Flow Strategy

1.  **HTML配信 (Vercel Edge):**
    - `User` -> `Cloudflare CDN` -> `Vercel` -> `R2 (Private MDX)`
    - MDXテキストは軽量であるため、Vercel経由でSSG/ISR配信します。
2.  **静的アセット配信 (Cloudflare CDN):**
    - `User` -> `Cloudflare CDN` -> `R2 (Public Assets)`
    - 画像・音源・譜例は容量が大きいため、**Vercelを通さず**、Cloudflare Worker経由でR2から直接配信します（Bandwidth offloading）。

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
│   ├── images/             # 記事画像・サムネイル
│   │   └── {slug}/         # e.g. works/bach/prelude-1
│   │       ├── cover.jpg   # サムネイル (統一名称)
│   │       ├── fig1.png
│   │       └── ...
│   ├── musical-examples/   # 譜例SVG
│   │   └── {slug}/
│   │       ├── ex1.svg
│   │       ├── ex2.svg
│   │       └── ...
│   └── audio/              # 音源ファイル (Free/Public)
│       └── {slug}/
│           ├── full.mp3
│           └── ...
└── private/                # 外部アクセス不可 (Next.js App Only)
    ├── articles/           # 原稿データ (MDX Source)
    │   └── {slug}/
    │       ├── ja.mdx
    │       ├── en.mdx
    │       └── ...
    └── backups/            # DBダンプ、ログ等
        └── ...
```

---

## 4. 公開アセットの配信仕様 (Public Assets)

### URL Schema

Cloudflare Workerにより、以下のURLパターンで配信します。

- **Base URL:** `https://cdn.preludiolab.com`
- **Path Mapping:** `/files/*` -> `R2: public/*`

| Asset Type | Public URL Example | R2 Path |
| :--- | :--- | :--- |
| **Thumbnail** | `/files/images/{slug}/cover.jpg` | `public/images/{slug}/cover.jpg` |
| **Score (SVG)** | `/files/musical-examples/{slug}/ex1.svg` | `public/musical-examples/{slug}/ex1.svg` |
| **Audio** | `/files/audio/{slug}/full.mp3` | `public/audio/{slug}/full.mp3` |

### Access Control (Worker Logic)

Cloudflare Workerにて以下の制御を行います。

1.  **Scope Restriction:** `public/` 配下のオブジェクトのみ参照を許可する。`private/` へのアクセスリクエストは `403 Forbidden` を返却する。
2.  **Anti-Hotlinking (Optional):** 必要に応じ、`Referer` ヘッダをチェックし、`preludiolab.com` 以外からの直リンクをブロックする（SNS OGP用クローラは許可する設定が必要）。
3.  **Cache Control:** `Cache-Control: public, max-age=31536000, immutable` を付与し、ブラウザおよびCDNで強力にキャッシュさせる。

---

## 5. 内部データの取扱仕様 (Private Data)

### MDX Articles

- **Path:** `private/articles/{slug}/{lang}.mdx`
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
  - サムネイル: `cover.jpg` (JPEG, Optimized)
  - 汎用画像: `fig{N}.{ext}` または意味のある英単語名。スペースはハイフンに置換。
- **Audio:**
  - フォーマット: MP3 (128kbps~192kbps for Web), AAC等。Web最適化されたエンコード推奨。
