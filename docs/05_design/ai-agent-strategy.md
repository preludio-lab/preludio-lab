# AI Agent Strategy (Hybrid Architecture)

## 1. Overview

本プロジェクトでは、AIエージェントの役割を**「システム開発（パートナーとしてのAntigravity）」**と**「コンテンツ・データ量産（自動化スクリプトとしてのGoogle AI SDK）」**に明確に分離したハイブリッド・アーキテクチャを採用します。

1.  **System Development (Antigravity)**:
    - 人間（エンジニア）の対話型パートナー。
    - 設計、コーディング、リファクタリング、課題解決。
    - ワークフローは非定型的であり、事前の固定的な自動化ではなく、対話を通じたアジャイルな開発を行う。

2.  **Content & Data Production (Google AI SDK)**:
    - 大量生産とスケーラビリティを目的とした自動化実行エンジン。
    - マスターデータ (JSON)、記事本文 (MDX)、楽譜データ、画像、音声の選定。
    - **Zero-Cost Architecture** を遵守し、Google AI Studio の無料枠 (Free Tier) をフル活用する。
    - GitHub Actions または ローカル CLI から非同期・一括実行（バッチ処理）を行う。

## 2. Producer's "Two-Sword" Style

| Category        | Environment             | Account / Cost          | Usage Purpose                                                                                              |
| :-------------- | :---------------------- | :---------------------- | :--------------------------------------------------------------------------------------------------------- |
| **Development** | **Antigravity (IDE)**   | **Subscription**        | **"The Partner":**<br>・コードの実装、デバッグ、テスト生成。<br>・アーキテクチャの議論とプロトタイプ作成。 |
| **Production**  | **Google AI SDK / CLI** | **Free Tier (API Key)** | **"The Factory":**<br>・マスターデータの量産 (One to Hundred)。<br>・多言語翻訳、アセット収集、定期更新。  |

## 3. Production Strategy: "Automated Pipe" (Robust & Stateful)

制作プロセスは、チャットボットとの会話ではなく、**「厳格なI/O定義に基づいたステートフルな自動処理パイプ」**として実装します。

1.  **Logical Core Domain**: `src/domain`, `src/application` を純粋なドメイン層として維持し、Agent から直接インポートして再利用する（物理的な移動は行わない）。
    30: 2. **State Management**: 中間生成物と進捗をローカルファイル (`agents/state`) や DB に永続化し、エラー時の中断・再開 (Resumability) を保証する。手軽なファイルベース管理を基本とする。
    31: 3. **Deterministic Validation**: LLM による修正の前に、Zod によるプログラム的な型チェックと自動修復を優先し、コストを削減する。

## 4. Execution Environments & Limits

### A. Local Environment (Admin CLI)

- 目的: 試行錯誤、即時修正、特定のマスターデータの先行生成。
- 構成: `agents/` ディレクトリ内のスクリプトを実行。

### B. GitHub Actions Environment (Batch)

- 目的: 定形作業、多言語展開、バルク処理。
- **制約 (Zero Cost):**
  - **Flash Model (Gemini 2.0 Flash):** 1.5K RPD / 15 RPM を最大限活用。データ量産は原則 Flash を推奨。
  - **Staging State:** いきなり公開せず、`status: review_pending` として保存し、人間による最終承認プロセスを経る。

## 5. Roadmap

1.  **Phase 1**: `Master Data Agent` (Composer/Work) の CLI 実装。
2.  **Phase 2**: `Content Agent` (Article/Phrase/Image) のワークフロー定義と実装。
3.  **Phase 3**: GitHub Actions による全自動バッチ・パイプラインの構築。
