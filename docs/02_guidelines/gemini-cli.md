# Gemini CLI 開発ガイド

Gemini CLI は Google が提供するオープンソースの AI コーディングアシスタントです。
Antigravity (VS Code 拡張) の API レートリミット時の代替や、ターミナルベースの作業を高度化するための補助ツールとして使用します。

## 概要

本プロジェクトでは、`GEMINI.md` に定義された開発コンテキストを Gemini CLI が自動的に読み込むように構成されています。これにより、プロジェクトのルールや規約を遵守した回答をターミナルから直接得ることが可能です。

## セットアップと実行

### 実行方法

`npx gemini` を実行すると、他の同名パッケージと衝突する可能性があるため、以下のいずれかの方法で実行してください。

#### 1. pnpm を使用する方法（推奨）

プロジェクトの `devDependencies` に登録されているため、名前の衝突を避け、確実にプロジェクトで管理されたバージョンを実行できます。

```bash
pnpm exec gemini
# または
pnpm gemini
```

#### 2. スコープ付きパッケージ名で実行する方法

依存関係をインストールせずに実行したい場合や、一時的に最新版を試したい場合に適しています。

```bash
npx @google/gemini-cli
```

### 初回認証

Google OAuth を使用します。初回起動時にブラウザが開くので、Google アカウントでログインしてください。

- **無料枠**: 1,000 req/day, 60 req/min (Gemini 2.0 Flash)

---

## 基本的な使い方

### 1. 対話モード (Interactive Mode)

プロジェクトルートで起動すると、`GEMINI.md` のコンテキストが自動的に読み込まれます。

```bash
pnpm gemini
```

### 2. ワンショットモード (One-shot Mode)

スクリプトやパイプラインでの利用、あるいは特定の質問を素早く投げたい場合に使用します。

```bash
# 基本的なプロンプト
pnpm gemini -p "このプロジェクトのディレクトリ構成を解説して"

# JSON 形式での出力
pnpm gemini -p "src/ 下の主要なコンポーネントを列挙して" --output-format json
```

### 3. モデルの指定

特定のモデル（例: Flash モデル）を明示的に指定して起動できます。

```bash
pnpm gemini -m gemini-2.0-flash
```

---

## 高度な設定

### GEMINI.md

プロジェクトルートにある `GEMINI.md` がメインのコンテキストファイルです。
`@path/to/file` 構文を使用して、`.agent/rules/` 内のルールやドキュメントを SSOT (Single Source of Truth) として参照しています。

> [!TIP]
> `GEMINI.md` を編集した後は、対話モード内で `/memory refresh` を実行することで、最新の情報を反映できます。

### .gemini/settings.json

プロジェクト固有の設定（MCP サーバーの接続設定、テーマ、ツール設定など）を管理します。

---

## Antigravity との使い分け

| 状況                     | 推奨ツール  | 理由                                               |
| :----------------------- | :---------- | :------------------------------------------------- |
| **通常のコーディング**   | Antigravity | IDE との強力な統合、ファイル操作の簡便さ           |
| **レートリミット到達時** | Gemini CLI  | 独立した API 枠での継続作業が可能                  |
| **ターミナル作業中**     | Gemini CLI  | 画面を切り替えずにコンテキストに基づいた質問が可能 |
| **CI/CD・自動化**        | Gemini CLI  | CLI オプション (`-p`) による自動化への組み込み     |

---

## 便利コマンド（対話モード内）

| コマンド          | 説明                                     |
| :---------------- | :--------------------------------------- |
| `/memory show`    | 読み込まれたコンテキストの確認           |
| `/memory refresh` | `GEMINI.md` 等の再読み込み               |
| `/tools`          | 利用可能なツール（ファイル操作等）の一覧 |
| `/help`           | コマンドリファレンスの表示               |

## トラブルシューティング

### 認証のリセット

ログイン情報に問題がある場合は、以下で再認証を行ってください。

```bash
pnpm gemini --login
```

### パッケージの重複・競合

もし `npx gemini` が意図しない挙動（別のツールが起動する等）をした場合は、常に `pnpm gemini` を使用するようにしてください。

---

## 参考リソース

- [Gemini CLI 公式リポジトリ](https://github.com/google-gemini/gemini-cli)
- [認証ガイド](https://github.com/google-gemini/gemini-cli/blob/main/docs/get-started/authentication.md)
- [プロジェクトの GEMINI.md](file:///Users/tetsu/src/preludio-lab/preludio-lab-refactor-generate-composer-workflow/GEMINI.md)
