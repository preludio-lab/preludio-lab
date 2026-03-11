# マスターデータ生成（Composer）ワークフロー仕様書

## 目的

高性能AIとGoogle Search (Grounding)を利用して、指定された作曲家の詳細な情報を収集し、世界最高のクラシック音楽サイトの基準に合致する高品質なマスタデータを生成します。

## ワークフロー概要

### 実行ライフサイクル (4-Phase Lifecycle)

開発者のレビュー負担を減らすため、以下の4ステップで構成されます。

1. **素案作成 (`draft`)**:
   - 日本語での歴史的背景や代表作の検索・集約。
   - `agents/workspace/temp/composers/{slug}.draft.json` を生成。
2. **レビュー反映 (`refine`)**:
   - 人間からのフィードバック（`--review`）に基づき内容を推敲。
   - `{slug}.refined.json` を生成。
3. **多言語翻訳 (`translate`)**:
   - 日本語データを基に、en, de, fr, it, es, zh へ翻訳。
   - レートリミット回避のため、1言語ずつ独立して処理。
   - `{slug}.translated.json` を生成。
4. **最終化 (`finalize`)**:
   - `Zod` スキーマによる最終検証。
   - 正式な保存先（`data/composers/{slug}.json`）へ永続化。

## 実行ガイド

### コマンド例

#### 1. 素案の作成

```bash
pnpm run workflow:composer --slug beethoven --name "Ludwig van Beethoven" --step draft
```

#### 2. レビューの反映

```bash
pnpm run workflow:composer --slug beethoven --step refine --review "代表作の解説に交響曲第9番の影響を追記してください"
```

#### 3. 翻訳の実行

```bash
pnpm run workflow:composer --slug beethoven --step translate
```

#### 4. データの確定（永続化）

```bash
pnpm run workflow:composer --slug beethoven --step finalize
```

#### 5. 全自動実行 (Auto Mode)

```bash
pnpm run workflow:composer --slug mozart --name "Wolfgang Amadeus Mozart" --auto
```

## 主要なオプション

- `--dry-run`: 実際のAPIコールや書き込みを行わず、バリデーションのみ実施。
- `--auto`: `draft` -> `translate` -> `finalize` を一括で実行。
- `--force`: 既存のマスターデータが存在する場合でも強制的に再生成。
