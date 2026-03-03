# AI Agent Workflows 仕様書

## 概要

AIエージェント、Coreモジュール、およびTools群を組み合わせて、一連のタスクやビジネスロジックを実行するためのスクリプト群を配置するディレクトリである。エージェントが主体となって業務プロセスを完遂するためのフロー定義が含まれる。

## 目的

1. エージェントやツールの単体操作だけでなく、それらを数珠つなぎにした「複合的なタスクプロセス（ワークフロー）」を定義する。
2. AIエージェントを利用した自動化スクリプトの実行手順をコードとして明文化し、結果の再現性を確保する。
3. エージェントの動作検証や、今後のバッチ処理基盤への拡張を容易にする。

## コーディング規約

ワークフローはCLIやバッチプロセスとして独立して動作する特殊なレイヤーであるため、以下の専用規約を遵守する。
※ 一般的なTypeScriptのコーディング規約や設計原則については、全体の [Development Guidelines](../../../docs/02_guidelines/development-guidelines.md) を参照すること。

### 1. 命名と構造 (Naming & Structure)

- **ファイル名**: ケバブケースとし、`-workflow.ts` をサフィックスとする（例: `import-scores-workflow.ts`）。
- **クラス名**: クラスとしてカプセル化し、`PascalCase` + `Workflow` とする（例: `class ImportScoresWorkflow`）。
- **エントリーポイント**: 外部から呼び出される主処理のメソッド名は `execute()` に統一する。

### 2. 入出力とスキーマ (I/O & Schemas)

- ワークフローの入力（引数）と出力（戻り値）は、必ず `Zod` スキーマを定義し、型付けとランタイム検証をセットで行う。
- スキーマ定義は Workflow ファイル内に同居（Colocation）させる（例: `ImportScoresInputSchema`）。
- 入力値は `execute(input: unknown)` で受け取り、直後に `InputSchema.parse(input)` を行うことで Validate-First を達成する。

### 3. ロギングと例外処理 (Logging & Error Handling)

- コンソールおよびログ収集基盤への出力を両立させるため、`src/core/logger.ts` (`consola`) を使用する。
- 致命的・リトライ不能な例外を捕捉（catch）した場合は、`logger.error({ id, error })` 等で処理中のコンテキスト情報を出力した後、必ず `throw` してプロセスを異常終了（`exit code 1`）させる。エラーの握りつぶしは厳禁とする。

## 実装ルール

当ディレクトリ内のワークフローは、APIコストの浪費やデータ不整合を防ぐため、以下のルールに従って実装する。

### 1. Thin Orchestrator (ビジネスロジックの分離)

- ワークフローは「読み込み」「エージェント/ツールの呼び出し」「保存」を繋ぐオーケストレーション層として機能させる。
- データパース、文字列操作、ドメイン固有の判定ロジックはワークフロー内に含めず、`src/domain` や `src/tools` に切り離す。

### 2. Mandatory State Management (専用モジュールによる状態管理)

- 複数ステップにまたがる処理の進捗管理は、`TaskStateManager` 等の専用モジュールを通して行う。ファイルへの直接書き込み等の個別な状態管理は行わない。
- **トランザクション境界（Chunk-based Checkpointing）**: 状態の保存は論理的なトランザクションの境界（例：1つのエンティティ処理完了時、または指定件数のバルク処理完了時）で行う。

### 3. Strict Idempotency (冪等性と再開性の確保)

- プロセスが中断（OOMやAPIエラー等）した場合でも、再実行時に成功済みのステップをスキップし、安全に再開できる設計とする。
- 状態の確認を伴わない外部API呼び出しや書き込み処理は行わない。

### 5. Fail-Fast & Observability (エラーハンドリングと可観測性)

- **早期チェックとAPIコスト保護**: 重いAPI処理を実行する前に最終永続化データの存在確認を行い（冪等性の早期チェック）、無駄なAPIコールをスキップする。
- **厳格な事前検証 (Validate-First)**: 各ステップでの一時保存や永続化の直前に、必ず `Zod` スキーマによる検証を行う。人間がテキストエディタで直接編集した一時ファイル（`*.refined.json` 等）を読み込む際は、単なるスキーマ検証だけでなく「正しいJSONフォーマットとしてパース可能か」を厳格に検証し、文法エラー時は開発者に分かりやすいエラーメッセージを出力する。
- **Rate Limit への耐性 (Resilience)**: Gemini API の一時的なネットワークエラーやレートリミット（429エラー）に備え、HTTPクライアントに Exponential Backoff を伴う自動リトライ機構を実装する。
- 予期せぬエラーやリトライ上限到達時は例外をキャッチせず、スタックトレースを残して即座に異常終了（`exit code 1`）させる。
- **可観測性の確保**: 異常終了の前には、`consola.error` 等を用いて処理中だったエンティティの識別子（IDやファイルパス等）を標準出力に記録し、リカバリを容易にする。

### 6. Mandatory Dry-run (Dry-runモードのサポート)

- 破壊的変更（DBへのUpsertやAPIコストの発生等）を伴うワークフローは、`--dry-run` フラグの入力をサポートする。
- 実行対象の件数や事前パース結果のみを、安全かつコストゼロで検証できる状態を確保する。

## ワークフロー一覧

### 1. マスターデータ生成（Composer） (`generate-composer-workflow.ts`)

- **目的**: 高性能AIとGoogle Search (Grounding)を利用して、指定された作曲家の詳細な情報を収集し、世界最高のクラシック音楽サイトの基準に合致する高品質なマスタデータを生成する。
- **入力 (`GenerateComposerInputSchema`)**:
  - `slug` (string): 作曲家の識別子（例: `beethoven`）
  - `name` (string): 検索やプロンプト生成に使用するフルネーム（例: `Ludwig van Beethoven`）
  - `dryRun` (boolean): `true` の場合は出力ファイルの存在確認やバリデーションのみ行い、API通信をスキップする（冪等性・安全性）。
  - `step` (enum): 実行するステップを指定する (`draft` | `refine` | `translate` | `finalize`)。
  - `review` (string): `step=refine` 時に渡す、人間のフィードバックや改善指示コメント。
  - `auto` (boolean): `true` の場合、全ステップを人間を介さず一気通貫で実行するモード。
- **出力先**:
  - 一時保存先 (draft後): `agents/workspace/temp/composers/{slug}.draft.json`
  - 一時保存先 (refine後): `agents/workspace/temp/composers/{slug}.refined.json`
  - 一時保存先 (translate後): `agents/workspace/temp/composers/{slug}.translated.json`
  - 永続化先 (finalize時): `data/composers/{slug}.json`
- **使用モデル**: `gemini-3.1-pro-preview` 等の高精度モデル（Grounding有効）
- **アーキテクチャの特徴**:
  - **Thin Orchestrator**: `AgentDataWriterTool` は Agent の関数としてではなく、ワークフロー自身のインフラ層として利用し、失敗時は `exit code 1` で終了する（Fail-Fast）。
  - **AI-assisted HITL (4-Phase Lifecycle)**: 開発者のレビュー負担を減らすため、「(1)素案作成 (`draft`)」→「(2)AIによるレビュー反映 (`refine`)」→「(3)翻訳 (`translate`)」→「(4)最終化 (`finalize`)」のライフサイクルを導入。人間は直接JSONを編集するのではなく、フィードバックテキストを渡してAIに直させる運用も可能とする。
- **処理フロー**:
  1. CLI引数として `slug`, `name`, `--step=...`, `--review=...`, `--auto` を受け取り Validate-First を実行する。
  2. 【素案作成 (`--step=draft`) または `--auto`時】:
     - 対象の作曲家情報を**日本語**で汎用的に検索・要約し、`ja`ノードのみ埋めたJSONデータを生成。
     - **[検証]**: `ComposerMasterSchema`（日本語検証用）でバリデーションを実施。
     - 一時領域に `{slug}.draft.json` として保存する。稼働者はこれを確認する。
  3. 【レビュー反映 (`--step=refine`)】:
     - `--review="..."` の指示に基づき、Agentが最新の一時ファイル（`draft.json` または既存の `refined.json`）を読み込んで改善版を再生成。
     - **[検証]**: スキーマで妥当性を検証後、一時ファイル `{slug}.refined.json` として保存する。
  4. 【翻訳作成 (`--step=translate`) または `--auto`継続時】:
     - 最新の素案ファイル（`refined.json` または `draft.json`）を読み込み、テキストベースに残り全言語（en, de, fr 等）へ翻訳処理を実施。
     - **[並列実行の独立性]**: 出力トークンの上限超過やJSON構造破損を防ぐため、1回のAPIコールで処理せず、言語ごとの配列（`['en', 'de', ...]`）に対してループを回し、言語単位で独立したプロンプトによる推論API呼び出し（`Promise.all`等による並列実行）を行う。
     - **[検証]**: スキーマ要件（全言語データが揃っているか等）を満たすか検証し、一時領域に `{slug}.translated.json` として保存する。
  5. 【最終化 (`--step=finalize`) または `--auto`継続時】:
     - 翻訳済みのデータ（`translated.json`）を読み込み、改めて全体の最終検証を実施。
     - `AgentDataWriterTool` を用いて最終永続化先（`data/composers/{slug}.json`）へ正式に出力する。
