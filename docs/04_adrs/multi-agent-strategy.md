# Multi-Agent Architecture Strategy

Date: 2025-12-16

## Status

Accepted

## Context

「Preludio Lab」において、コンテンツ制作およびシステム開発を自動化するためにAIエージェントを活用する計画である。
しかし、Google AI StudioのAPI（特に高性能なProモデル）を無料枠（Free Tier）で利用する場合、**RPM (Requests Per Minute) が極めて低い**（数回/分）という厳格な制約がある。

従来の一般的な「チャットルーム型マルチエージェント（LangChainやCrewAIなど）」を採用した場合、以下の問題が発生する：
1.  **Rate Limit Exceeded:** エージェント間の会話が短時間にAPIを連打するため、即座にRPM制限に達する。
2.  **Token Explosion:** 会話履歴をコンテキストとして持ち回るため、TPM (Tokens Per Minute) 制限にも抵触しやすい。
3.  **Observability:** 処理がブラックボックス化し、どこで意図しない挙動をしたかの特定が困難になる。

## Decision

無料枠での運用を最優先とし、以下の**「ファイルバケツリレー方式 (File Bucket Relay)」** および **「No-Framework Policy」** を採用する。

### 1. File Bucket Relay Architecture (via GitHub Artifacts)
エージェント（スクリプト）同士は直接通信せず、成果物を介して連携する。
ただし、リポジトリの肥大化を防ぐため、中間ファイル（JSONなど）はGitコミットせず、**GitHub Actions Artifacts**（一時ストレージ）を利用して受け渡す。

*   **Workflow:**
    1.  `Director` が `context.json` を生成し、`actions/upload-artifact` で保存（Gitにはコミットしない）。
    2.  `Writer` が `actions/download-artifact` で前工程の成果物を取得・執筆し、最終的な `draft.md` のみをブランチにコミットしてPRを作成する。
*   **Benefits:**
    *   **Clean Repository:** 試行錯誤や中間データがGit履歴に残らず、リポジトリを軽量に保てる。
    *   **Observability:** デバッグが必要な際は、GitHub Actionsの実行ログからArtifact ZIPをダウンロードして確認できる（90日間保持）。
    *   **Rate Limit Safe:** ジョブ分割によるRPM回避のメリットは維持される。

### 2. No-Framework Policy
LangChain, Semantic Kernel, Google Genkit などのAIオーケストレーションフレームワークは**使用しない**。

*   **Implementation:** Google公式の軽量SDK (`@google/generative-ai`) のみを使用した、単純なTypeScript/Pythonスクリプトとして実装する。
*   **Reason:** フレームワークによる隠蔽（勝手なリトライやプロンプト注入）を排除し、APIコール数とトークン量を開発者が100%コントロール可能にするため。

### 3. "Two-Sword" Style (Producer vs Agent)
有料サブスクリプション（Google AI Pro）を持つ人間と、無料API（Google AI Studio）を使うシステムの役割を明確に分離する。

*   **Producer (Human/Paid):** プロトタイプ作成、プロンプト開発、動画生成。
*   **Agent (System/Free):** 決定したプロンプトを用いた量産実行。

## Consequences

### Positive
*   **Zero Cost:** 工夫次第で、高性能なAIモデルを用いたパイプラインを完全無料で運用可能になる。
*   **High Observability:** 中間成果物がすべてファイルとしてコミットされるため、デバッグや品質チェックがGitの履歴を見るだけで完結する。
*   **Simplicity:** 複雑なフレームワークを覚える必要がなく、保守性が高い。

### Negative
*   **High Latency:** バッチ処理となるため、リアルタイム性は損なわれる（記事完成まで数十分〜数時間かかる）。
*   **Manual Orchestration:** フレームワークが自動でやってくれるエラーハンドリングやチェーン管理を、GitHub ActionsのYAMLやスクリプトで自前実装する必要がある。
