# MDX記事配信システム設計 & 執筆ガイドライン (Article System)

## 1. 概要 (System Overview)

本システムは、音楽理論解説記事（テキスト、楽譜、音声）を多言語で効率的に管理・配信するための基盤です。
MDX (Markdown JSX) を採用することで、記事本文内にReactコンポーネント（楽譜レンダラーやプレイヤー）を直接埋め込むことを可能にします。
また、ビルド時に静的生成 (SSG/GenerateStaticParams) を行い、コストゼロかつ高速な配信を実現します。

## 2. アーキテクチャ (Architecture)

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

## 3. URL設計とストレージ構造

### URL設計 (User Perspective)

ユーザーがアクセスするURLは、SEOと可読性のために **Slug** をベースにします。
`/[language]/works/[composer_slug]/[slug]`

- **命名規則:** [slug-naming-conventions.md](../01_overall/slug-naming-conventions.md) に準拠します（例: `symphony-no-5/1-allegro`）。
- **Mapping:** アプリケーション層で Slug から UUID を逆引きし、実体データを取得します。

### ストレージ配置 & ディレクトリ構成

実体ファイルは、将来のSlug変更に耐性を持たせるため **UUID** で保存（DB連携時）、または **Slugベースのディレクトリ構造**（Git管理時）で管理されます。
現状のGit管理ベースの構成は以下の通りです。

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

## 4. Frontmatter Schema & Metadata

各MDXファイルの先頭には、以下のFrontmatterをYAML形式で記述します。
厳格な型定義 (`src/domain/entities/content.ts`) によりバリデーションされます。

### Field Definitions

| Field          | Type   | Required | Description                                                        |
| :------------- | :----- | :------- | :----------------------------------------------------------------- |
| **title**      | string | **Yes**  | 記事のタイトル（作品名）。ページの `h1` に使用される。             |
| **composer**   | string | No       | 作曲者の表示名。                                                   |
| **work**       | string | No       | 収録作品集名など（e.g. "The Well-Tempered Clavier, Book I"）。     |
| **key**        | string | No       | 調性（e.g. "C Major", "ハ長調"）。                                 |
| **difficulty** | enum   | No       | `"Beginner"`, `"Intermediate"`, `"Advanced"`。                     |
| **tags**       | array  | No       | 検索用タグのリスト。                                               |
| **videoId**    | string | No       | YouTubeの動画ID (11桁)。**設定するとAudio Playerが有効化される。** |
| **startTime**  | number | No       | 再生開始時間（秒）。                                               |
| **endTime**    | number | No       | 再生終了時間（秒）。                                               |
| **performer**  | string | No       | 演奏者名。                                                         |
| **artworkSrc** | string | No       | アルバムアートワーク画像のURL。                                    |
| **date**       | string | No       | 作成/更新日 (YYYY-MM-DD)。                                         |

### 記述例

```yaml
---
title: 'Prelude in C Major'
composer: 'Johann Sebastian Bach'
work: 'The Well-Tempered Clavier, Book I'
key: 'C Major'
difficulty: 'Intermediate'
tags: ['Baroque', 'Piano']
videoId: 'gVah1cr3pU0'
startTime: 10
endTime: 40
performer: 'Lang Lang'
---
```

## 5. 本文記述ルール (Markdown/MDX)

### 5.1 見出し構成

- **H1:** Frontmatterの `title` が自動的に使用されるため、本文内には記述しない。
- **H2 (`##`):** 大セクション（Analysis, Structure, History など）。目次（TOC）に表示される。
- **H3 (`###`):** 小セクション。

### 5.2 楽譜の埋め込み (ABC Notation)

`abc` 言語を指定したコードブロックは、自動的に楽譜としてレンダリングされます (`ScoreRenderer`)。
また、`videoId` が設定されている場合、楽譜上に「Play Audio」ボタンが表示されます。

#### ディレクティブとメタデータ継承ルール

1.  **Time Reset Rule:**
    ABC側で時間が指定された場合 (`%%audio_startTime` / `%%audio_endTime`)、Frontmatterの時間設定は**継承されません**。

2.  **Video Context Reset Rule:**
    ABC側で動画IDが指定された場合 (`%%audio_videoId`)、**全てのメタデータ（タイトル、作曲者、演奏者、画像など）は継承されません**。完全に新しいコンテキストとして扱われます。必要な情報はディレクティブで再定義してください。

#### 記述例

````markdown
```abc
X:1
% %%audio_title は指定しない（Frontmatterのタイトルを使用）
%%audio_startTime 10
M:4/4
...
```
````

### 5.3 コンポーネントの使用

MDX内では、Reactコンポーネントを直接使用することは（原則として）避ける。標準Markdown記法と、専用のレンダラー（ScoreRenderer等）を通じて機能を提供する。

## 6. コアコンポーネント仕様

### `ScoreRenderer` (Client)

- ABC記法テキストを受け取り、SVG楽譜をレンダリングします。
- ` ```abc ` コードブロックが自動的にこのコンポーネントに置換されます。

### `TableOfContents` (Client)

- 記事内の見出し (`h2`, `h3`) を抽出し、サイドバーに目次を表示します。
- `rehype-slug` により付与されたIDを使用します。

### `SeriesNavigation` (Server)

- 同一カテゴリ内の記事リストから、前後の記事へのリンクを生成します。

### `SearchBox` (Client)

- サイト内全文検索。Supabase Hybrid Search (RPC) を利用します。

## 7. 多言語ルーティング戦略

`preludiolab.com/[lang]/works/[[...slug]]`
(Catch-all Segmentにより、`works/bach/prelude-1` のような深い階層に対応)

`generateStaticParams` 関数により、サポートされている全言語（7言語）× 全記事の組み合わせを事前に計算し、ビルド時にHTML化します。

## 8. 複数楽譜・音声セグメント管理 (Multi-Score Strategy)

一つの記事内に複数の譜例（Excerpts）が存在し、それぞれが異なる再生範囲を持つ場合に対応するため、**Cascading Audio Metadata** 戦略を採用します。

### メタデータ解決順序

1.  **Level 1: Page Context (Frontmatter)** - 記事全体のデフォルト。
2.  **Level 2: Excerpt Context (ABC Directives)** - 個別の譜例による上書き。

### ABC記述構文 (Directives)

```abc
X:1
T:Theme A (Measures 1-4)
%%audio_videoId {id}     % Triggers Context Reset
%%audio_title {text}
%%audio_startTime 15
%%audio_endTime 25
...
```
