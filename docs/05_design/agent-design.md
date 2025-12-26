# AI Agent Design (Multi-Agent System)

## 1. Architecture Overview
本システムは **Multi-Agent System (MAS)** として設計され、各エージェントは独立した責務を持つ。
通信方式には **File Bucket Relay (via GitHub Artifacts)** を採用し、Zero Cost (Free Tier) 環境での安定稼働を実現する。

Ref: [ADR: Multi-Agent Architecture](../04_adrs/multi-agent-strategy.md)
Ref: [Strategy: AI Agent Strategy](ai-agent-strategy.md)

## 2. Agent Roles & Responsibilities

### 2.1. Content Division (制作部門)

#### [AGENT-CONTENT-DIR] Content Director (Orchestrator)
*   **Role:** 進行管理、構成作成。
*   **Input:** Theme (e.g., "Bach: Air on the G String")
*   **Action:**
    1.  Gemini(Flash)を使用し、記事構成案 (Skeleton) を作成。
    2.  `Writer`, `Composer`, `Curator` への指示書を含む `context.json` を生成。
*   **Output:** `context.json` (Upload to Artifacts)

#### [AGENT-WRITER] Writer (Specialist)
*   **Role:** 本文執筆 (Musicologist)。
*   **Input:** `context.json` (Download from Artifacts)
*   **Action:**
    1.  Contextに基づき、Gemini(Pro)を使用して解説本文を執筆。
    2.  Markdown形式で整形。
*   **Output:** `draft_ja.md` (Upload to Artifacts)

#### [AGENT-COMPOSER] Composer (Specialist)
*   **Role:** 楽譜データ作成 (Engraver)。
*   **Input:** `context.json`
*   **Action:** 指定された小節のABC記法テキストを生成。
*   **Output:** `scores.json` (Upload to Artifacts)

#### [AGENT-CURATOR] Curator (Specialist)
*   **Role:** 動画選定。
*   **Input:** `context.json`
*   **Action:** YouTube Data APIを叩き、条件に合う動画IDを取得。
*   **Output:** `videos.json` (Upload to Artifacts)

#### [AGENT-TRANS] Translator (Specialist)
*   **Role:** 多言語展開。
*   **Input:** `master_ja.md` (from Git Branch)
*   **Strategy:** **Decoupled Batch Worklow.** 言語ごとに独立したジョブとして、時間差で実行する。
*   **Output:** `draft_[lang].md` (Trigger Validator)

#### [AGENT-VALIDATOR] Validator (Quality Gate)
*   **Role:** 音楽専門用語のバリデーション・自動修正。
*   **Input:** `draft_[lang].md`
*   **Action:**
    1.  「多言語音楽用語辞書」および「理論ソース」に基づき、誤訳（例: Key→鍵、Note→メモ）を検閲する。
    2.  誤りがある場合、修正案を生成してファイルを更新する（Auto-fix）。
*   **Output:** `verified_[lang].md` (Commit to Branch)

#### [AGENT-REVIEWER] Chief Editor (Reviewer)
*   **Role:** 品質管理。
*   **Input:** All Artifacts
*   **Action:** 整合性チェック、Facts Check。
*   **Output:** Approval or Feedback (Retry Loop Max: 2)

---

### 2.2. Engineering Division (開発部門)

#### [AGENT-TECH-LEAD] Tech Lead (Orchestrator)
*   **Role:** 技術設計、ボイラープレート生成。
*   **Responsibility:** 要件定義からファイル設計までを一気通貫で担当。

#### [AGENT-ENGINEER] Engineer (Implementer)
*   **Role:** 実装 & 自己レビュー。
*   **Responsibility:** Lint/Type Checkをパスしたコードのみを提出する。

#### [AGENT-QA] QA Engineer (Specialist)
*   **Role:** テスト生成。
*   **Responsibility:** Vitest / Playwright のテストコードを作成。

## 3. Implementation Details (File Bucket Relay)

### Data Schema (context.json)
```json
{
  "theme": "Bach: Air on the G String",
  "structure": [
    {
      "section_id": "intro",
      "instruction_for_writer": "バッハの生涯と曲の背景...",
      "instruction_for_composer": null
    },
    {
      "section_id": "analysis",
      "instruction_for_writer": "通奏低音の特徴...",
      "instruction_for_composer": "冒頭4小節のバスライン"
    }
  ]
}
```

### Prompt Engineering Standard (RCICO)
全てのプロンプトは `prompt-engineering-standard.md` に従い **RCICO** (Role, Context, Instruction, Constraint, Output) 形式で記述する。
