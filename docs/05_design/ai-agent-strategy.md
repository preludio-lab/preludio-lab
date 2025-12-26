# AI Agent Strategy & Workflow (Multi-Agent Architecture)

## 1. Overview
本プロジェクトでは、AIエージェントを**「専門分化されたマルチエージェント・システム (MAS)」** として構築します。
「Orchestrator (調整役)」「Specialist (専門家)」「Reviewer (品質管理者)」の3層構造を採用しつつ、**Zero Cost Architecture (Free Tier)** の制約に基づき、APIコール数と実行時間を最適化した **"Cost-Effective Model"** を実装します。

## 2. Agent Team Structure

### 2.0. Producer's Role & Tools (The "Two-Sword" Style)
GoogleのAIサービスにおける「Consumer (Google AI Pro)」と「Developer (Google AI Studio)」の特性を使い分けたハイブリッド開発ワークフロー。

| Role | Environment | Account / Cost | Usage Purpose |
| :--- | :--- | :--- | :--- |
| **Producer** (Human) | **Google AI / Gemini Advanced** | **Google AI Pro (Paid)** | **"Zero to One" (Few-Shot Creation):**<br>・最高のお手本（Teacher Data / Prompt Example）を作る。<br>・エージェントが量産するための「型」を発明する。<br>・Veoによる高品質な動画素材生成。 |
| **Agent** (System) | **GitHub Actions / Local** | **Free Tier (API Key)** | **"One to Hundred" (Mass Production):**<br>・Producerが作った「型」に沿って、違うテーマで量産する。<br>・無料枠制限内での着実な実行（Time-shifted execution）。 |

---

### 2.0.1. Technical Architecture: "File Bucket Relay"
無料のマルチエージェントシステムの正体は、チャットボット同士の会話ではなく、**「Git上のファイルを介したバケツリレー」** です。

1.  **Director:** `director.ts` が起動。Gemini(Flash)がテーマから「構成案」を作成し、**JSONファイルに保存**する。
2.  **Writer:** `writer.ts` が起動。JSONを読み込み、Gemini(Pro)が記事を執筆し、**Markdownファイルに保存**する。
3.  **Translator:** `translator.ts` が起動（時差出勤）。Markdownを読み込み、翻訳ファイルを保存する。

この「ファイルベース連携」により、エージェント間の通信コストをゼロにし、状態管理をGitに一任します。

---

### 2.1. Content Division (コンテンツ制作部門)
**Mission:** 音楽学的価値の高い記事と、正確な実技データ（楽譜）を生産する。
**Strategy:** Orchestratorが生成する **"Shared Context"** を「唯一の正解」として共有し、各Agentの認識ズレを防ぐ。

| Layer | Role | Agent Name | Responsibilities |
| :--- | :--- | :--- | :--- |
| **Orchestrator** | 進行管理 | **Content Director** | ・**Shared Context (Skeleton)** の保存 (`.json`)<br>・各スペシャリストへの並列指示 |
| **Specialist** | 執筆 | **Writer** (Musicologist) | ・Shared Contextに基づいた本文執筆 (`.md`生成)<br>・辞書/理論コンテキストの適用 |
| **Specialist** | 楽譜作成 | **Composer** (Engraver) | ・Shared Contextで指定された箇所のABC記法テキスト出力<br>・**Verification:** 構文エラーチェックのみ（音楽的妥当性はProducerが判断） |
| **Specialist** | 動画選定 | **Curator** | ・YouTube Data API検索<br>・品質基準に基づく選定 |
| **Specialist** | 動画選定 | **Curator** | ・YouTube Data API検索<br>・品質基準に基づく選定 |
| **Specialist** | 翻訳 (EN) | **Translator (EN)** | ・英語への翻訳担当。Nuanceや慣用句の最適化。 |
| **Specialist** | 翻訳 (ES) | **Translator (ES)** | ・スペイン語への翻訳担当。 |
| **Specialist** | 翻訳 (DE/FR/IT/ZH) | **Translator (Others)** | ・各言語担当エージェントとして独立定義。 |
| **Reviewer** | 品質管理 | **Chief Editor** | ・Fact Check / Guideline Check<br>・Tone & Manner Check |

#### Content Workflow (Distributed Batch Strategy)
1.  **Director:** "Shared Context" を作成。
2.  **Writer/Composer:** 日本語マスターコンテンツを作成し、マージ。
3.  **Translators (Decoupled Batch):**
    *   **Trigger:** マスターのマージを検知、またはスケジュール実行。
    *   **Strategy:** 言語ごとに独立したジョブとして、**数十分〜数時間の間隔を空けて順次実行**する。
    *   **Benefit:**
        *   **No Timeout:** 1言語処理は数分で終わるため、GitHub Actionsの制限にかからない。
        *   **Rate Limit Safe:** 同時実行を避けることで、Free TierのRPM/RPDを安全に守る。
        *   **Isolation:** 英語翻訳が失敗しても、スペイン語翻訳は止まらない。

---

### 2.2. Engineering Division (システム開発部門)
**Mission:** ベストプラクティスに準拠した堅牢なシステムを高速に構築する。
**Strategy:** Roleを統合してAPIコール回数を削減し、タイムアウトとRate Limitを回避する。

| Layer | Role (Consolidated) | Agent Name | Responsibilities |
| :--- | :--- | :--- | :--- |
| **Orchestrator**<br>+ **Architect** | 技術統括 | **Tech Lead** | ・要件定義からファイル設計(Domain/UseCase/UI)までを一気通貫で生成<br>・ボイラープレート作成 |
| **Implementer**<br>+ **Reviewer** | 実装技術者 | **Engineer** | ・コーディング、自己レビュー(Lint/Type Check)を済ませてから提出<br>・「実装→自己修正」のループを内部で完結させる |
| **Specialist** | 品質保証 | **QA Engineer** | ・E2Eテストシナリオ (Playwright) 作成<br>・Unit Test (Vitest) 作成 |

#### Engineering Workflow (Cost-Effective)
1.  **Tech Lead:** 機能要件を受領し、設計とファイル雛形を一括生成。
2.  **Engineer:** 実装を行い、自己レビューで品質を高める。
3.  **QA Engineer:** テストコードを生成。
4.  **Output:** テストパス済みのコードをPRとして提出。

## 3. Execution Environments & Limits

### A. Local Environment (Sprint & Prototype)
*   **Purpose:** 試行錯誤、即時修正、エージェント開発自体。
*   **Target:** `Tech Lead` による設計試行, `Composer` による楽譜プレビュー。

### B. GitHub Actions Environment (Batch & CI)
*   **Purpose:** 定形作業、大量処理。
*   **Constraints (Zero Cost) [Dec 2025 Validated]:**
    *   **Dynamic Limits:** Free Tierの制限は需要に応じて動的に変動する（"Basic Access"）。
        *   **Pro Model (High Quality):** 非常に厳格（目安: 2 RPM / 50 RPD）。ここぞという「Writer（執筆）」にのみ限定して使用する。
        *   **Flash Model (High Speed):** 比較的多め（目安: 15 RPM / 1,500 RPD）。翻訳、Lint、テスト生成などの「量」が必要なタスクは必ずFlashを使用する。
    *   **Timeout:** GitHub Actionsのホステッドランナー（約6時間）よりも、API側の1分間制限（RPM）が先にボトルネックになるため、`sleep` 処理が必須。
    *   **Fallback Strategy:** エージェントが Rate Limit Error (429) を返した場合、自動的に Flash Model へ切り替えて再試行するロジックを実装する。

## 4. Implementation Roadmap
まずは **Content Division** のプロトタイプから着手する。

1.  **Phase 1:** `Writer` (旧 Musicologist) の実装。
    *   まずは単体で動かし、記事生成能力を確認。
2.  **Phase 2:** `Composer` と `Shared Context` の実装。
    *   記事と楽譜の整合性を取る仕組みの構築。
3.  **Phase 3:** `Director` (Orchestration) と `Circuit Breaker` の実装。
