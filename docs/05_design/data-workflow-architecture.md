# Data Generation AI Workflow Architecture

本ドキュメントでは、Google AI SDK (Gemini API) を使用したデータ生成ワークフローの全体的な技術アーキテクチャを定義します。

## 1. Directory Structure

Next.js フロントエンド、共有ドメインロジック、エージェントを、論理的・物理的に整合性を持って配置します。

```text
.
├── agents/                  # AI Data Pipeline & Batch Processor (Node.js/TS)
│   ├── src/
│   │   ├── core/            # Gemini API Wrapper, ADK Orchestrator
│   │   ├── workflows/       # 業務フロー (ex: score-extraction-flow.ts)
│   │   ├── infrastructure/  # CLI用Repo実装 (File System, Direct DB Access)
│   │   ├── state/           # 進捗管理 (SQLite/Local JSON)
│   │   └── prompts/         # プロンプトテンプレート (.md / .txt)
│   ├── tsconfig.json        # src/domain を参照するための Path Alias 設定
│   └── package.json
│
├── src/                     # Shared Core & Web Application
│   ├── domain/              # ★ ビジネスルール・エンティティ (Agentと共有)
│   ├── application/         # ★ ユースケース・インターフェース (Agentと共有)
│   ├── infrastructure/      # Webアプリ用実装 (Next.js環境依存)
│   └── app/                 # Next.js App Router (UI/Routing)
│
├── public/                  # 静的資産 (生成済みSVG譜例等のキャッシュ先)
└── tsconfig.json            # Path Aliases (@/* -> src/*)
```

## 2. Integrated Workflows

本アーキテクチャでは、データの性質に応じて 3 つのワークフローパターンを定義し、各アセットを管理します。

| Workflow Pattern   | Target                  | Description                                        | Source of Truth         |
| :----------------- | :---------------------- | :------------------------------------------------- | :---------------------- |
| **A. Master Data** | **Composer, Work**      | 作曲家・楽曲のメタデータ。アプリの骨格。           | **GitHub (JSON)**       |
| **B. Content**     | **Article (Gen/Trans)** | 楽曲解説記事、翻訳。LLM 主体の生成物。             | **Cloudflare R2 (MDX)** |
| **C. Asset**       | **Score, Phrase**       | 楽譜原本 (MusicXML/Kern/PDF) および抜粋 SVG 譜例。 | **Cloudflare R2**       |

### Workflow Map

- **[Pattern A] Composer 生成**: 作曲家の基本情報、年表、主要作品リスト。
- **[Pattern A] Work 生成**: 楽曲のメタデータ、楽章構成、楽曲分析、印象分析。
- **[Pattern B] Article 生成**: 楽曲解説、教育的分析、演奏アドバイス（MDX）。
- **[Pattern B] Article 翻訳**: 記事、メタデータ、UI ラベルの多言語展開。
- **[Pattern C] Score 生成**: 楽譜ソース (MusicXML/Kern) の収集と最適化。
- **[Pattern C] Phrase 生成**: 楽曲中の特定の小節を抜粋した SVG 譜例（旧 MusicalExample）。

## 3. Data Persistence & Lifecycle Strategy

データの性質に応じて、「保存場所」と「同期タイミング」を厳密に区分します。これにより、開発中の試行錯誤による本番DBの汚染を防ぎ、SaaSのコストを最小化します。

### 3.1 Data Zones & Roles

| Zone                | Environment      | Storage Tech         | Role                                                                                                  | Data Persistence                                             |
| :------------------ | :--------------- | :------------------- | :---------------------------------------------------------------------------------------------------- | :----------------------------------------------------------- |
| **Workspace**       | Local PC (Agent) | SQLite / File System | **一時作業領域 (Scratchpad)**。<br>生成途中のドラフト、ダウンロードしたMusicXML、中間ログ。           | **Ephemeral**<br>(生成完了後、または次回実行時に破棄/上書き) |
| **Source of Truth** | GitHub Repo      | JSON / YAML Files    | **マスタデータ正本**。<br>Composer, Work, WorkPart の定義情報。人間によるレビューと履歴管理を行う。   | **Permanent**<br>(Git Version Control)                       |
| **Production**      | Cloud (Vercel)   | Turso (LibSQL)       | **検索・表示用メタデータ**。<br>Source of Truthおよび生成結果から同期された、アプリが参照するデータ。 | **Replica / Meta**<br>(Operational Data)                     |
| **Content Store**   | Cloud (Edge)     | Cloudflare R2        | **コンテンツ実体**。<br>MDX記事、楽譜原本 (MusicXML/PDF)、SVG譜例、画像。                             | **Permanent**<br>(Object Storage)                            |

### 3.2 Workflow Patterns

#### Pattern A: Master Data Sync (Git-Ops Flow)

作曲家や楽曲の基本情報は、GitHub上の JSON ファイルを正本とします。

1.  **Produce (Agent)**: AI エージェントが調査（Web/ドキュメント）を行い、構造化された JSON（例: `data/composers/bach.json`）を自動生成。
2.  **Review & Commit**: 生成結果を人間がレビューし、GitHub レポジトリへコミット（Source of Truth の確定）。
3.  **Sync (CI/CD)**: GitHub Actions が変更を検知し、`agents/infrastructure` のスクリプトが Turso へ Upsert。
    - _Note_: アプリケーション（Turso）は常に GitHub の内容を「正」として同期される。

#### Pattern B: Content Generation Pipeline (Local-First Flow)

記事（MDX）の生成は、**「メタデータ確定」と「本文執筆」の2フェーズ**に分割し、手戻りを最小化します。

1.  **Draft Metadata (Phase 1)**:
    - Agent が楽曲情報 (Pattern A) を基に、SEO 用のタイトル、スラッグ、要約、構成案を生成。
    - 開発者がローカルで JSON を確認・修正し、確定させる。
2.  **Draft Content (Phase 2)**:
    - 確定したメタデータを入力として、Agent が本文 (MDX) を執筆。
    - 執筆プロセスは `agents/workspace/temp/` で完結。
3.  **Validation**: ローカル内で Zod チェック及び textlint 等による自動校正。
4.  **Publish (Deploy)**:
    - 最終成果物（MDX）を **R2** へアップロード。
    - 検索用メタデータを **Turso** へ書き込み（Upsert）。

#### Pattern C: Asset Pipeline (Tool-Centric Flow)

譜面データや SVG 譜例は、外部ソースの取得とツールによる変換が主体となります。

1.  **Ingest**: `agents/infrastructure` のスクリプトが IMSLP 等から楽譜（MusicXML / Kern）を取得し `agents/workspace/` へ保存。
2.  **Process**: ドメインサービス（Verovio 等）を呼び出し、特定の小節を抽出・最適化したアセット（SVG）を生成。
3.  **Deploy**: 生成された SVG を **R2** へアップロード。
4.  **Link**: アセットの URL パスを、関連する記事（Pattern B）または楽曲（Pattern A）のメタデータに反映。

## 4. Technical Approach: Efficient Integration

### Logical Core Domain

`src/domain` と `src/application` は、Next.js 固有機能（`next/navigation`等）への依存を持たない純粋な TypeScript モジュールとして実装します。これらを Agent から直接インポートすることで、コードの重複を排除します。

### Abstraction of Infrastructure

`src/application/repositories` でインターフェースを定義し、環境に応じて実装を差し替えます。

- **Web 実行時**: `src/infrastructure` の実装（LibSQL/Drizzle, R2 Client 等）を使用。
- **Agent 実行時**: `agents/infrastructure` の実装を使用。レート制限を考慮した直接的な DB 操作や、中間データの保存（State 管理）を行います。

### Async Score Generation Workflow

譜例（SVG）生成は Verovio (WASM) の負荷が高いため、テキスト生成とは別の非同期ステップとして実行します。

1. **Drafting**: Agent が記事テキストと「必要な譜例の定義（小節番号、パート等）」を生成し DB に保存。
2. **Engraving**: 別の Worker (Agent) が DB を監視し、定義に基づき `src/domain/services` のロジックで小節を抽出。
3. **Rendering**: Verovio を用いて SVG を生成し、R2 または `public/` へ配置し、パスを DB に更新。

### Strict Dependency Rules

`eslint-plugin-import` を用い、`domain` 層や `application` 層が `next/*` や `react`、`infrastructure` に依存することを厳格に禁止します。

## 5. Agent Execution Lifecycle (Stateful & Cost-Effective)

単一の生成で完結せず、以下のサイクルを通じてデータの精度を向上させます。特に譜例生成（SVG）は重いため、非同期で分離します。

1.  **Initialize & Check State**: ターゲットの処理進捗を確認し、未完了ステップから開始。
2.  **Structural Research**: 検索結果を構造化データとして保存。
3.  **Draft Production**: `responseSchema` を活用し、構造的に正しい JSON を生成。
4.  **Async Score Generation**: 譜例生成 (Verovio/SVG) は独立した非同期ワーカーで実行し、記事生成とは分離する（タイムアウト回避）。
5.  **Programmatic Validation (Zod)**: LLM Critique の前に、プログラムによる型チェックと自動修復を実行。
6.  **Semantic Critique (LLM)**: 「内容の正確性」「トーン」のみを AI がレビュー。
7.  **Persist to Staging**: `status: review_pending` として DB に保存し、人間による最終確認を待つ。

## 6. Agent Definition & Tool Integration (ADK)

Google AI SDK (ADK) を用い、`src/application` 層と `src/domain` 層をエージェントに統合します。

- **Schema-First Agent**: `src/domain/schemas` (Zod) をそのままエージェントの `responseSchema` として活用し、構造化出力を強制します。
- **Tool Calling Bridge**: `src/application` 層のインターフェースを ADK の `tools` として登録します。
  - **Note**: ユースケース自体は共有可能ですが、リポジトリ等の `infrastructure` 層は CLI 用の Adapter ( SQLite / 直接 DB 接続等 ) を DI して実行します。
- **Context Injection**: 必要なマスタデータや過去の生成結果を、実行時に `history` または `context` として動的に注入します。

```typescript
// Implementation Example
const orchestratorAgent = adk.defineAgent({
  model: 'gemini-2.0-flash',
  systemInstruction: systemPrompts.producer,
  tools: [searchMetadataTool, saveDataTool], // src/application use-cases with CLI DI
  responseSchema: TargetSchema, // src/domain schemas
});
```

## 7. Multi-Agent Orchestration Flow

単一の巨大なプロンプトによる「一撃生成」を避け、役割を分担した小規模なエージェントを連結することで、精度とデバッグ性を向上させます。

1.  **The Researcher (情報収集)**: 外部ソースや内部 DB から、生成に必要な根拠（Fact）を収集・構造化する。
2.  **The Producer (ドラフト作成)**: 収集データに基づき、メインコンテンツ（JSON または MDX）を構成する。
3.  **The Specialist (専門処理)**: 非 AI ツールや特定の音楽理論ロジック（例：譜例抽出サービス）を動かし、アセットを生成する。
4.  **The Critic (検証・修正)**: 生成物と根拠データの整合性をレビューし、不適合があれば Producer にリライトを指示する。

## 8. Evaluation & Guardrails

生成物の品質を担保するための自動化された評価基準を定義します。

- **Programmatic Validation (Zod)**: 生成された JSON がドメインモデルの制約（小節番号が正の値、IDが存在する等）を満たしているかチェック。
- **Semantic Check**: Gemini 自身に「譜例の説明と実際の小節内容に矛盾がないか」を判定させる。
- **Hallucination Prevention**: 存在しない作品番号 (Op.) や偽の初演年が含まれていないか、Turso 上のマスタデータと照合する。

## 9. Error Handling & Recovery (Self-Healing)

数万件規模のバッチ処理に耐えうるレジリエンス（回復力）を定義します。

- **Retry Policy**: API レート制限や一時的なエラーに対する指数バックオフ (Exponential Backoff) の実装。
- **State Persistence**: `agents/state` に各ステップの出力を保存し、エラー中断時に「どの楽曲のどのステップから再開するか」を自動判別可能にする。
- **Human-in-the-loop**: AI の確信度が低い（Critique で不合格）場合のみ、`status: needs_manual_fix` フラグを立てて人間の介入を仰ぐ。
