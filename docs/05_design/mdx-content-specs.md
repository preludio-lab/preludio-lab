# MDXコンテンツ作成ガイドライン (v1.0)

本プロジェクトにおける楽曲分析コンテンツ（MDX）の作成ルール、ディレクトリ構造、およびメタデータスキーマについて定義する。

## 1. ディレクトリ構造とURL設計

### ファイル配置
コンテンツは以下のルールに従って配置する。
`content/[language]/[category]/[composer]/[slug].mdx`

*   **language:** `en`, `ja` 等のISO言語コード。
*   **category:** 現在は `works` のみ。
*   **composer:** 作曲者名（スラッグ形式, e.g. `bach`, `mozart`）。フォルダ分けに使用。
*   **slug:** 作品名（スラッグ形式, e.g. `prelude-1`）。

### URLマッピング
ファイルパスは自動的に以下のURLにマッピングされる。
`/[language]/works/[composer]/[slug]`

**例:**
*   File: `content/en/works/bach/prelude-1.mdx`
*   URL: `/en/works/bach/prelude-1`

---

## 2. Frontmatter Schema (メタデータ)

各MDXファイルの先頭には、以下のFrontmatterをYAML形式で記述する。

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| **title** | string | **Yes** | 記事のタイトル（作品名）。ページの `h1` に使用される。 |
| **composer** | string | No | 作曲者の表示名。 |
| **work** | string | No | 収録作品集名など（e.g. "The Well-Tempered Clavier, Book I"）。 |
| **key** | string | No | 調性（e.g. "C Major", "ハ長調"）。 |
| **difficulty** | enum | No | `"Beginner"`, `"Intermediate"`, `"Advanced"`。 |
| **tags** | array | No | 検索用タグのリスト。 |
| **videoId** | string | No | YouTubeの動画ID (11桁)。**設定するとAudio Playerが有効化される。** |
| **startTime** | number | No | 再生開始時間（秒）。 |
| **endTime** | number | No | 再生終了時間（秒）。 |
| **performer** | string | No | 演奏者名。 |
| **artworkSrc** | string | No | アルバムアートワーク画像のURL。 |
| **date** | string | No | 作成/更新日 (YYYY-MM-DD)。 |

### 記述例
```yaml
---
title: "Prelude in C Major"
composer: "Johann Sebastian Bach"
work: "The Well-Tempered Clavier, Book I"
key: "C Major"
difficulty: "Intermediate"
tags: ["Baroque", "Piano"]
videoId: "gVah1cr3pU0"
startTime: 10
endTime: 40
performer: "Lang Lang"
---
```

---

## 3. 本文記述ルール (Markdown/MDX)

### 3.1. 見出し構成
*   **H1:** Frontmatterの `title` が自動的に使用されるため、本文内には記述しない。
*   **H2 (`##`):** 大セクション（Analysis, Structure, History など）。目次（TOC）に表示される。
*   **H3 (`###`):** 小セクション。

### 3.2. 楽譜の埋め込み (ABC Notation)
`abc` 言語を指定したコードブロックは、自動的に楽譜としてレンダリングされる。
また、`videoId` が設定されている場合、楽譜上に「Play Audio」ボタンが表示される。

#### ディレクティブとメタデータ継承ルール

1.  **Time Reset Rule:**
    ABC側で時間が指定された場合 (`%%audio_startTime` / `%%audio_endTime`)、Frontmatterの時間設定は**継承されません**。

2.  **Video Context Reset Rule:**
    ABC側で動画IDが指定された場合 (`%%audio_videoId`)、**全てのメタデータ（タイトル、作曲者、演奏者、画像など）は継承されません**。完全に新しいコンテキストとして扱われます。必要な情報はディレクティブで再定義してください。

#### 3.2.1. 譜例のタイトル表記
ABC記法内の `T: (Title)` フィールドは、文字サイズが大きくデザインを損なう可能性があるため、**表示用としては使用せず、MDX本文中に記述することを推奨します**。

*   **Mini Playerの表示:** 通常、譜例ごとの見出し（「第1主題」など）ではなく、楽曲全体のタイトル（「Prelude...」）を表示するのが望ましいです。その場合、`%%audio_title` は**指定しないでください**（自動的にFrontmatterのタイトルが継承されます）。
*   `T:` を削除し、MDX本文にタイトルを書くのが基本スタイルです。

**記述例:**

**Ex. 1: Theme (Arpeggio Pattern)**
````markdown
```abc
X:1
% %%audio_title は指定しない（Frontmatterのタイトルを使用）
%%audio_startTime 10
M:4/4
...
```
````

### 3.3. コンポーネントの使用
MDX内では、Reactコンポーネントを直接使用することは（原則として）避ける。標準Markdown記法と、専用のレンダラー（ScoreRenderer等）を通じて機能を提供する。
*理由: 執筆者の負担軽減と、将来的なコンテンツ移行の容易性確保のため。*

---

## 4. ワークフロー
1.  **作成:** `content/[lang]/works/[composer]/` に `.mdx` ファイルを作成。
2.  **Frontmatter記入:** 上記スキーマに従ってメタデータを埋める。
3.  **本文執筆:** Markdownで記述。楽譜はABC記法で挿入。
4.  **プレビュー:** `npm run dev` でローカルサーバーを立ち上げ、該当URL（`/[lang]/works/...`）にアクセスして確認。
