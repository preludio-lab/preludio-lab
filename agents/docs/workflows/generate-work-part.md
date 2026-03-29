# マスターデータ生成（WorkPart）ワークフロー仕様書

## 目的

既存の楽曲（Work）に紐付く各WorkPart（楽章、断章、アリア等）の詳細情報を生成します。
楽曲全体の構造（作品構成、順序、テンポ指示、多言語解説）を、親となる楽曲のコンテキストを維持しながら構造化します。

> [!IMPORTANT]
> 本ワークフローを実行する前に、親となる楽曲（Work）のマスターデータが `data/works/{composerSlug}/{workSlug}.json` に存在している必要があります。

## ワークフロー概要

### 実行ライフサイクル (4-Phase Lifecycle)

1. **素案作成 (`draft`)**:
   - 指定された構成に基づき、各WorkPartのテンポ、拍子、調性、詳細解説を生成。
   - `agents/workspace/temp/works/{workSlug}.parts.draft.json` を生成。
2. **レビュー反映 (`refine`)**:
   - 自動的な整合性チェック、または人間からの指示に基づき内容を修正。
   - `{workSlug}.parts.refined.json` を生成。
3. **多言語翻訳 (`translate`)**:
   - WorkPartタイトル（多言語での呼称）や速度記号の翻訳、解説文の翻訳。
   - `{workSlug}.parts.translated.json` を生成。
4. **最終化 (`finalize`)**:
   - `Zod` スキーマ検証後、WorkPartごとの個別ファイル（`data/works/{composerSlug}/{workSlug}/{partSlug}.json`）として保存。

## 実行ガイド

### コマンド例

#### 1. 素案の作成

`--parts` にWorkPartリストを指定します。

```bash
pnpm run workflow:work-part --composer-slug beethoven --work-slug symphony-5 --parts '[{"title":"I. Allegro con brio","order":1},{"title":"II. Andante con moto","order":2},{"title":"III. Scherzo. Allegro","order":3},{"title":"IV. Allegro","order":4}]' --step draft
```

#### 2. レビューの反映

```bash
pnpm run workflow:work-part --composer-slug beethoven --work-slug symphony-5 --step refine --review "第2楽章の解説にヴィオラとチェロの主題について言及してください"
```

#### 3. 翻訳の実行

```bash
pnpm run workflow:work-part --composer-slug beethoven --work-slug symphony-5 --step translate
```

#### 4. 全自動実行 (Auto Mode)

```bash
pnpm run workflow:work-part --composer-slug beethoven --work-slug symphony-5 --parts '...' --auto
```

## 主要なオプション

- `--composer-slug`: 作曲家のスラッグ（必須）。
- `--work-slug`: 親楽曲のスラッグ（必須）。
- `--parts`: 楽章構成の定義（JSON形式）。
- `--auto`: `draft` -> `translate` -> `finalize` を一括で実行。
