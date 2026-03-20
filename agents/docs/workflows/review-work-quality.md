# 楽曲・楽章マスターデータ品質レビュー（AIエージェント用）ワークフロー

## 目的

生成された楽曲（Work）および楽章（WorkPart）のマスターデータが、音楽学的な正確性と多言語の品質基準を満たしているかを検証します。

## レビューのタイミング

1. **Work生成時**: 楽曲の基本情報、作品番号、編成の正確性を確認。
2. **WorkPart生成時**: 楽章構成の網羅性、テンポ指示、各楽章の解説の質を確認。

---

## 1. 楽曲（Work）の検証

### Gemini CLI 用プロンプト

```text
@data/works/{composerSlug}/{workSlug}.json を確認し、以下の項目を検証してください。

- **作品番号 (catalogNumber)**: 正しい作品番号（Op., BWV, K.等）が付与されているか？
- **作曲時期 (compositionPeriod)**: 研究に基づいた正確な年代範囲か？
- **編成・キーワード**: 楽曲のジャンルや楽器編成を表すタグは適切か？
- **説明文 (description.ja)**: 楽曲の歴史的重要性と音楽的特徴が簡潔にまとめられているか？
```

---

## 2. 楽章（WorkPart）の検証

### Gemini CLI 用プロンプト

```text
@data/works/{composerSlug}/{workSlug}/*.json を確認し、以下の項目を検証してください。

- **楽章構成の妥当性**: 親楽曲の構造として、タイトルの順序やタイプ（movement等）は標準的な出版譜と一致しているか？
- **音楽的特徴の記述**: 各楽章の解説において、主要な主題、形式（ソナタ形式等）、特徴的な楽器法が正確に記述されているか？
- **テンポと速度記号**: 速度記号（Allegro等）の解釈が適切か？
```

---

## 3. 多言語・タイポグラフィ検証 (共通)

### Gemini CLI / Antigravity 用プロンプト

```text
対象ファイルの多言語フィールドについてレビューしてください。

1. **整合性と自然な呼称**:
   - 各言語において、標準的な呼称が採用されているか？（例: 英 "Moonlight Sonata", 独 "Mondscheinsonate"）
   - 楽章の速度記号の翻訳が、その言語の音楽用語として自然か。
2. **タイポグラフィの厳守**:
   - EN: ' ' (Single quotes)
   - DE: „ “ (German quotes)
   - FR / ES: « » (Guillemets, FRは前後にスペース)
   - ZH: 《 》 (書名号)
3. **言語の混線 (Language Bleed)**:
   - 各言語のフィールドに他言語が混入していないか。
```

---

## 4. レビュー結果の反映方法

```bash
# Workの場合
pnpm run workflow:work --composer-slug {slug} --work-slug {slug} --step refine --review "..."

# WorkPartの場合
pnpm run workflow:work-part --composer-slug {slug} --work-slug {slug} --step refine --review "..."
```
