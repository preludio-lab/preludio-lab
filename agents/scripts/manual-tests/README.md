# 手動テスト (Manual Tests)

AI Agent Core モジュール群の動作確認用スクリプト。  
自動テスト（Vitest）とは異なり、外部API接続を伴う統合テストやデモ目的で使用する。

## 前提条件

- `agents/.env.local` に `GEMINI_API_KEY` を設定済みであること
- `pnpm install` 済みであること

## 実行方法

`agents/` ディレクトリから `tsx` で実行する:

```bash
cd agents
npx tsx scripts/manual-tests/test-core.ts
npx tsx scripts/manual-tests/test-tools.ts
```

## テストファイル一覧

| ファイル          | 概要                                                          |
| ----------------- | ------------------------------------------------------------- |
| `test-core.ts`    | `BaseAgent` + `AgentTool` + `ResilientFetcher` の統合動作確認 |
| `test-tools.ts`   | `AgentDataWriterTool` のデモ（データ生成→ファイル保存）       |
| `test-reflect.ts` | Gemini SDK の基本接続確認                                     |
| `test-fetch.ts`   | カスタム `fetch` 注入パターンの動作確認                       |

## 注意事項

- これらのスクリプトは実際の外部APIを呼び出すため、CI では実行しない
- テスト結果はターミナル出力で確認する（レポート生成なし）
- `tsconfig.json` の `include` に `scripts/**/*` が含まれているため、型チェックの対象である
