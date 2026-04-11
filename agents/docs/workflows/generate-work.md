# マスターデータ生成（Work）ワークフロー仕様書

## 目的

特定された作曲家の各楽曲（Work）の詳細情報を収集し、構造化されたマスタデータを生成します。
楽曲の基本情報、作品番号、作曲時期、編成などのメタデータを正確に生成・多言語化します。

> [!NOTE]
> WorkPartの生成は、本ワークフロー完了後に [WorkPart生成ワークフロー](./generate-work-part.md) を使用して行います。

## ワークフロー概要

### 実行ライフサイクル (5-Phase Lifecycle)

1. **素案作成 (`draft`)**:
   - 楽曲の基本情報（作品番号、作曲時期、編成等）を検索・提案。
   - `agents/workspace/temp/works/{workSlug}.draft.json` を生成。
2. **ドラフト推敲 (`refine-draft`)**:
   - 人間からのフィードバック（`--review`）に基づき内容を推敲。
   - 既存データの整合性チェックや、タイトルの要素分解の最終確認を行う。
   - `{workSlug}.draft-refined.json` を生成。
3. **多言語翻訳 (`translate`)**:
   - 日本語データを基に、en, de, fr, it, es, zh へ翻訳。
   - 楽曲タイトルや、ニックネームの言語固有の呼称を最適化。
   - `{workSlug}.translated.json` を生成。
4. **翻訳推敲 (`refine-translate`)**:
   - 翻訳後の多言語データに対し、誤訳の修正やトーン（静謐と気品）の調整を行う。
   - 中国語における日本語漢字の混入など、言語特有の品質問題を修正する。
   - `{workSlug}.translated-refined.json` を生成。
5. **最終化 (`finalize`)**:
   - `Zod` スキーマによる最終検証。
   - 以下の優先位順位で中間ファイルを採用し、正式な保存先（`data/works/{composerSlug}/{workSlug}.json`）へ永続化。
     1. `{workSlug}.translated-refined.json`
     2. `{workSlug}.translated.json`
     3. `{workSlug}.draft-refined.json`
     4. `{workSlug}.draft.json`

## 実行ガイド

### コマンド例

#### 1. 素案の作成

```bash
pnpm run workflow:work --composer-slug beethoven --composer-name "Ludwig van Beethoven" --work-slug symphony-no-5 --work-title "交響曲第5番" --step draft
```

#### 2. ドラフトの推敲

```bash
pnpm run workflow:work --composer-slug beethoven --work-slug symphony-5 --step refine-draft --review "編成にトロンボーンとピッコロを追加してください"
```

#### 3. 翻訳の実行

```bash
pnpm run workflow:work --composer-slug beethoven --work-slug symphony-5 --step translate
```

#### 4. 翻訳の推敲

```bash
pnpm run workflow:work --composer-slug beethoven --work-slug symphony-5 --step refine-translate --review "中国語の『間』を簡体字に直し、フランス語の調性表記をより格調高くしてください"
```

#### 5. データの確定（永続化）

```bash
pnpm run workflow:work --composer-slug beethoven --work-slug symphony-5 --step finalize
```

#### 5. 全自動実行 (Auto Mode)

```bash
pnpm run workflow:work --composer-slug beethoven --composer-name "Ludwig van Beethoven" --work-slug symphony-no-5 --work-title "交響曲第5番" --auto
```

## 主要なオプション

- `--composer-slug`: 作曲家のスラッグ（必須）。
- `--composer-name`: 作曲家のフルネーム。AIエージェントの認識精度向上のために使用。`draft` ステップまたは `auto` 実行時のみ必須。
- `--work-slug`: 楽曲のスラッグ（必須）。
- `--work-title`: 楽曲の日本語正式名称。`draft` ステップまたは `auto` 実行時のみ有効（指定がない場合は `work-slug` が使用される）。
- `--dry-run`: 実際のAPIコールや書き込みを行わず、バリデーションのみ実施。
- `--auto`: `draft` -> `translate` -> `finalize` を一括で実行。
- `--force`: 既存のマスターデータが存在する場合でも強制的に再生成。
