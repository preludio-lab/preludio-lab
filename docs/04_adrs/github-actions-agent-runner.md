# GitHub Actions as Agent Infrastructure

Date: 2025-12-15

## Status

Accepted

## Context

AIエージェント（コンテンツ生成スクリプト）を実行するためには、PythonやNode.jsが動作する計算リソース（Compute）が必要です。
常時稼働サーバー（EC2, VPS）や、都度課金のServerless環境（Cloud Run, Lambda）はコストがかかります。また、ローカルPCのみでの実行は自動化の観点で不十分です。

## Decision

**GitHub Actions** をAIエージェントの実行環境（Runner）として採用します。
`schedule` トリガー（Cron）を用いて定期的にスクリプトを実行し、コンテンツ生成を行います。

## Consequences

### Positive
*   **Zero Cost:** Public Repositoryであれば、GitHub Actionsの実行時間は無料（あるいは十分な枠がある）。
*   **Integration:** ソースコードと同じ場所でスクリプトを管理・実行でき、PR作成などのGit操作が容易。

### Negative
*   **Timeout:** 1ジョブあたりの実行時間に制限（通常6時間だが、Free枠等を考慮すると短めが安全）がある。大量生成時はバッチ分割が必要。
*   **Ephemeral:** 実行ごとに環境がリセットされるため、永続データの保存にはGitコミットまたは外部ストレージ（Supabase/Drive）が必要。
