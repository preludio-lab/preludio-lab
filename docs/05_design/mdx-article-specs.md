# MDX記事作成ガイドライン (v1.0)

本プロジェクトにおける楽曲分析記事（MDX）の作成ルール、ディレクトリ構造、およびメタデータスキーマについて定義する。

## 1. URL設計とストレージ構造

### URL設計 (User Perspective)

ユーザーがアクセスするURLは、SEOと可読性のために **Slug** をベースにします。
`/[language]/works/[composer_slug]/[slug]`

- **Mapping:** アプリケーション層で Slug から UUID を逆引きし、実体データを取得します。

### ストレージ配置 (System Perspective)

実体ファイルは、将来のSlug変更に耐性を持たせるため **UUID** で保存されます（Git管理はしません）。
`Storage: article/[uuid].mdx`

---

## 2. Frontmatter Schema (メタデータ)

各MDXファイルの先頭には、以下のFrontmatterをYAML形式で記述する。

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

### 2.1. Zod Schema Definition

アプリケーション層でのバリデーションに使用するZodスキーマ定義は以下の通りです。

```typescript
import { z } from 'zod';

export const ContentSchema = z.object({
  // Metadata (メタデータ)
  title: z.string().min(1),
  description: z.string().optional(), // SEO用メタディスクリプション
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD
  updated: z.string().optional(),

  // Taxonomy (分類)
  category: z.enum([
    'Introduction', // 楽曲紹介 (Work Analysis)
    'Composer', // 作曲家
    'Theory', // 音楽理論
    'Era', // 時代様式
    'Instrument', // 楽器
    'Performer', // 演奏家
    'Terminology', // 用語集
    'Column', // コラム
    'Originals', // オリジナル
  ]),
  tags: z.array(z.string()).optional(),

  // Series (Optional: シリーズ機能)
  series: z.string().optional(), // シリーズのSlug
  seriesOrder: z.number().optional(), // シリーズ内での順序

  // Content Specific
  composer: z.string().optional(), // 例: "Johann Sebastian Bach". Introductionカテゴリでは必須
  work_id: z.string().optional(), // 例: "BWV 846". Introductionカテゴリでは必須
  key: z.string().optional(), // 例: "C Major"
  difficulty: z.number().min(1).max(5).optional(), // 1:初級 〜 5:超絶技巧

  // Media (メディア連携)
  thumbnail: z.string().optional(), // OGP用画像パス
  youtube_id: z.string().optional(), // メイン動画ID
  youtube_start: z.string().optional(), // 再生開始時間 (HH:MM:SS)
  youtube_end: z.string().optional(), // 再生終了時間 (HH:MM:SS)
  ogp_excerpt: z.string().optional(), // OGP生成用ABC譜面
});
```

---

## 3. 本文記述ルール (Markdown/MDX)

### 3.1. 見出し構成

- **H1:** Frontmatterの `title` が自動的に使用されるため、本文内には記述しない。
- **H2 (`##`):** 大セクション（Analysis, Structure, History など）。目次（TOC）に表示される。
- **H3 (`###`):** 小セクション。

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

- **Mini Playerの表示:** 通常、譜例ごとの見出し（「第1主題」など）ではなく、楽曲全体のタイトル（「Prelude...」）を表示するのが望ましいです。その場合、`%%audio_title` は**指定しないでください**（自動的にFrontmatterのタイトルが継承されます）。
- `T:` を削除し、MDX本文にタイトルを書くのが基本スタイルです。

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
_理由: 執筆者の負担軽減と、将来的な記事データ移行の容易性確保のため。_

---

## 4. ワークフロー (Admin UI)

1.  **作成:** Admin UI または エージェント経由でDBレコードを新規作成。
2.  **執筆:** エディタで本文を記述。楽譜はABC記法で挿入。保存時に自動的に `article/[uuid].mdx` としてStorageに保存。
3.  **公開:** ステータスを `published` に変更。
4.  **反映:** On-demand ISRにより、URL（`/[lang]/works/...`）に即座に反映される。
