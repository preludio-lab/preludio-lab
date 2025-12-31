# 多言語MDX記事システム設計書 (v1.0)

## 1. 概要

本システムは、音楽理論解説記事（テキスト、楽譜、音声）を多言語で効率的に管理・配信するための基盤です。
MDX (Markdown JSX) を採用することで、記事本文内にReactコンポーネント（楽譜レンダラーやプレイヤー）を直接埋め込むことを可能にします。
また、ビルド時に静的生成 (SSG) を行い、コストゼロかつ高速な配信を実現します。

## 2. アーキテクチャ

### Tech Stack

- **Content Format:** MDX (Markdown + JSX)
- **Parser:** `next-mdx-remote` (Server Components対応)
- **Validation:** `zod` (Frontmatterの型安全性を担保)
- **Search:** `Supabase Hybrid Search` (Full Text + Vector)
- **Rendering:** Server Side Generation `generateStaticParams`

### Data Flow

1.  **Authoring (AI/Human):** `content/[lang]/` 配下にMDXを作成。
2.  **Build Time:**
    - Next.jsがファイルシステムからMDXを読み込み。
    - Frontmatterを検証し、メタデータを抽出。
    - `src/app/[lang]/works/[...slug]/page.tsx` が各記事をHTMLとして静的生成。
    - `FsContentRepository` (Infrastructure) がMDXファイルを読み込み、`src/domain/entities/content.ts` (Domain) のZod Schemaで検証。
    - `rehype-slug` が見出しIDを付与。
    - ビルド完了後、`postbuild` スクリプトがメタデータをSupabaseへ同期（予定）
3.  **Run Time:**
    - ユーザーはCDNから静的HTML（キャッシュ）を取得。
    - 楽譜はクライアントサイド (`ScoreRenderer`) でSVGとして描画。
    - 検索はSupabaseのRPCをコールし、高速なハイブリッド検索を実行。

## 3. ディレクトリ構成

### Content Repository

記事ファイルは言語コードごとのディレクトリに配置され、ディレクトリ階層がそのままURLパスとなります。

```
content/
├── en/
│   └── works/
│       ├── bach/               # Composer Directory
│       │   └── prelude-1.mdx   # -> /en/works/bach/prelude-1
│       └── mozart/
│           └── k545.mdx
├── ja/
│   └── works/
│       └── bach/
│           └── prelude-1.mdx
└── [lang]/
    └── [category]/
        └── [...slug].mdx       # Catch-all pattern
```

### Frontmatter Schema

記事のメタデータは厳格に型定義 (`src/domain/entities/content.ts`) されてます。

```yaml
---
title: 'Prelude in C Major' # 記事タイトル
composer: 'Johann Sebastian Bach' # 作曲家名
work: 'The Well-Tempered Clavier' # 作品名（コレクション名）
key: 'C Major' # 調性
difficulty: 'Intermediate' # 難易度 (Beginner/Intermediate/Advanced)
tags: ['Baroque', 'Piano'] # タグ
ogp_excerpt: 'X:1...' # OGP画像生成用のABC譜面スニペット
date: '2025-12-18' # 作成日
---
```

## 4. コアコンポーネント

### `ScoreRenderer` (Client)

- **役割:** ABC記法テキストを受け取り、SVG楽譜をレンダリングします。
- **統合:** MDX内で ` ```abc ` というコードブロックを使用すると、カスタムコンポーネントとしてこのレンダラーに置換されます。

### `TableOfContents` (Client)

- **役割:** 記事内の見出し (`h2`, `h3`) を抽出し、サイドバーに目次を表示します。
- **実装:** `rehype-slug` によりHTMLヘッダーにIDが付与され、それを元にリンクを生成します。

### `SeriesNavigation` (Server)

- **役割:** 同一カテゴリ内の記事リストから、前後の記事へのリンクを生成します。
- **ロジック:** 現状はタイトル順、将来的には作品番号順などでソート可能とします。

### `SearchBox` (Client)

- **役割:** サイト内全文検索を提供します。
- **実装:** Supabase Hybrid Search (RPC) をコールし、入力されたクエリに対して結果をリアルタイム表示します。
- **特徴:** サーバーレスでスケーラブルな検索を実現します（Pagefindより移行）。

## 5. 多言語ルーティング戦略

### URL構造

`preludiolab.com/[lang]/works/[[...slug]]`
(Catch-all Segmentにより、`works/bach/prelude-1` のような深い階層に対応)

### Static Generation

`generateStaticParams` 関数により、サポートされている全言語（7言語）× 全記事の組み合わせを事前に計算し、ビルド時にHTML化します。
パフォーマンス最適化のため、全コンテンテンツ取得時には本文を含まない軽量な `getAllContentSummaries` メソッドを使用します。
存在しない言語やスラッグへのアクセスは `404 Not Found` となります。

## 6. 今後の拡張性

- **MP3/Audio File Support:** 現在はYouTubeのみですが、ローカル音声ファイルへの対応もFrontmatterの拡張で可能です。
- **Dynamic OGP:** `ogp_excerpt` を使用したビルド時のOGP画像生成（`vercel/og` 利用）を予定しています。

## 7. 複数楽譜・音声セグメント管理 (Multi-Score Strategy)

一つの記事内に複数の譜例（Excerpts）が存在し、それぞれが異なる再生範囲を持つ場合に対応するため、**Cascading Audio Metadata** 戦略を採用します。

### 7.1. 階層化されたメタデータ

メタデータは以下の順序で解決（Merge）されます。**Level 2 (Excerpt)** の設定が優先されます。

1.  **Level 1: Page Context (Frontmatter)**
    - **役割:** ページ全体の「正」となる情報源（Source of Truth）。
    - **定義項目:** `videoId` (必須), `performer`, `work`, 基本となる `startTime/endTime`.
    - **Use Case:** 記事全体で共通する演奏音源。

2.  **Level 2: Excerpt Context (ABC Directives)**
    - **役割:** 個別の譜例に対する上書き設定。
    - **Time Reset Rule:** ABC側で `startTime` または `endTime` のいずれかが指定された場合、Frontmatterの `startTime/endTime` は**一切継承されず、リセットされます。**
    - **Video Context Reset Rule:** ABC側で `videoId` が指定された場合、**タイトル、作曲者、演奏者などの全メタデータも継承されません**。完全に独立した音源として扱われます。

### 7.2. ABC記述構文 (Directives)

ABC記法内のコメント行としてメタデータを埋め込みます。`ScoreRenderer` はこれを解析し、再生制御に使用します。

```abc
X:1
T:Theme A (Measures 1-4)
%%audio_videoId {id}     % Triggers Context Reset
%%audio_title {text}
%%audio_startTime 15
%%audio_endTime 25
...
```

**利用可能なディレクティブ一覧:**

| Directive            | Description                  | Example                          |
| :------------------- | :--------------------------- | :------------------------------- |
| `%%audio_startTime`  | 再生開始時間 (秒)            | `%%audio_startTime 15`           |
| `%%audio_endTime`    | 再生終了時間 (秒)            | `%%audio_endTime 25`             |
| `%%audio_videoId`    | 動画ID (Context Reset)       | `%%audio_videoId gVah1cr3pU0`    |
| `%%audio_title`      | 表示タイトル                 | `%%audio_title Theme A`          |
| `%%audio_composer`   | 作曲者名 (Context Reset時用) | `%%audio_composer J.S. Bach`     |
| `%%audio_performer`  | 演奏者名 (Context Reset時用) | `%%audio_performer Glenn Gould`  |
| `%%audio_artworkSrc` | アートワークURL              | `%%audio_artworkSrc /images/...` |
