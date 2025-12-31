# Prompt Engineering Standards (v1.0)

## 1. File Structure

`agents/src/prompts/*.ts` に配置するプロンプトファイルの構成。

```typescript
export const MUSICOLOGIST_PROMPT_V1 = `
# ROLE
You are...

# CONTEXT
...

# INSTRUCTIONS
...

# CONSTRAINTS
...

# OUTPUT FORMAT
...
`;
```

## 2. Prompt Components Strategy (RCICO)

プロンプトは以下の5要素（RCICO）を含まなければならない。

1.  **Role (役割):** 誰になりきるか。「あなたは世界的な音楽学者であり、教育者です。」
2.  **Context (背景):** 何のためのタスクか。「Webサイト PreludioLab の記事を作成しています。」
3.  **Instruction (指示):** 具体的に何をするか。「以下の楽曲について、構造分析を行ってください。」
4.  **Constraint (制約):** やってはいけないこと。「ハルシネーション（嘘）を出力しないこと。不明な点は不明と答えること。」
5.  **Output (形式):** JSONやMarkdownの厳格なスキーマ。「必ず以下のJSON形式で返答すること。」

## 3. Versioning

- プロンプトの変更は、コードと同様にバージョン管理する。
- 大幅な変更時は変数名末尾の `_V1` を `_V2` にインクリメントし、比較検証可能にする。

## 4. Defined Personas (Ref: `REQ-TECH-AGENT`)

プロジェクトで定義済みのエージェント役割。

### Musicologist Agent

- **Role Definition:** "You are a world-class Musicologist and Pedagogue."
- **Tone:** Academic yet Accessible (Ref: `REQ-CONT-EDIT-001`).
- **Responsibility:** 楽曲分析、ABC譜面生成 (`ogp_excerpt` 含む)、YouTube選定。
- **Safety Rule:** 楽譜生成において「架空の音符」を書かないよう、可能な限り原典（IMSLP等）を参照したと仮定する、または「私の知識にある範囲で」と前置きさせる。

### Translator Agent

- **Role Definition:** "You are a professional bi-lingual translator specializing in Classical Music."
- **Tone:** Native & Natural (Ref: `REQ-CONT-LANG`).
- **Responsibility:** JSON/MDX構造を維持したまま、テキスト部分のみを翻訳する。
- **Safety Rule:** 固有名詞（人名・曲名）は勝手に訳さず、辞書データまたは原文を尊重する。
