# ワークフロー: 指定楽曲の事前構造抽出 (Work Pre-generation)

このワークフローは、特定の作曲家の指定された楽曲について、正式な名称、スラグ（`work-slug`）、および内部構造（楽章などの `work-part-slug`）をAIエージェントを用いて抽出し、メタデータ生成の準備を整えることを目的とします。

## 1. 準備

- **対象の特定**: 生成を行いたい作曲家と楽曲（例: ベートーヴェンのピアノソナタ第29番）を決定します。
- **基本情報の確認**: [target_composers.md](../../../docs/03_management/target_composers.md) で対象作曲家の `Slug` を確認します。

## 2. AIによる構造抽出

AIエージェント（Gemini CLI等）に対し、以下のプロンプトを使用して指示を出します。

- **使用プロンプト**: `agents/docs/prompts/work-pre-generation-prompt.md`
- **入力内容**:
  - 作曲家名およびスラグ
  - 対象とする楽曲の指定（「〜を対象にして」など）

### 実行例 (イメージ)

```bash
# Gemini CLI等のツールで実行
gemini run --prompt agents/docs/prompts/work-pre-generation-prompt.md "ベートーヴェン (beethoven) のピアノソナタ第29〜32番をリストアップして"
```

## 3. 出力の保存

AIが生成した構造化Markdownを、以下の場所に保存します。

- **保存先**: `agents/workspace/work-lists/{composer-slug}.md`
  - 特定のカテゴリに限定する場合は `{composer-slug}-{category}.md` としても構いません。

## 4. 次のステップ

保存された Markdown ファイルは、後続の「作品・楽章メタデータ生成ワークフロー」の入力データとして使用されます。
内容が [作品スラグ命名規則](../rules/work-slug-naming.md) に厳格に従っていることを目視で確認してください。
