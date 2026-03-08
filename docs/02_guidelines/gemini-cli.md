# Gemini CLI 開発ガイド

Gemini CLI は Google が提供するオープンソースの AI コーディングアシスタント。
Antigravity（VS Code拡張）の API レートリミット時の代替・補助ツールとして使用する。

## セットアップ

### 前提条件

- Node.js 18 以上（プロジェクトは 22.x を使用）
- pnpm（プロジェクトのパッケージマネージャー）

### インストール

プロジェクトの `devDependencies` に含まれているため、追加のインストールは不要。

```bash
# pnpm install で自動的にインストールされる
pnpm install
```

### 初回認証

Google OAuth（推奨）を使用する。初回起動時にブラウザが開くので、Googleアカウントでログインする。

```bash
npx gemini
# ブラウザが開き、Googleアカウントでの認証を求められる
# 無料枠: 60 req/min, 1,000 req/day
```

## 基本的な使い方

### 対話モード

プロジェクトルートで起動すると、`GEMINI.md` のコンテキストが自動的に読み込まれる。

```bash
# プロジェクトルートで起動
npx gemini
```

### ワンショットモード（非対話）

スクリプトやパイプラインでの利用に適している。

```bash
# 単発の質問
npx gemini -p "このプロジェクトの構成を説明して"

# JSON形式で出力
npx gemini -p "src/の主要ディレクトリを列挙して" --output-format json
```

### モデル指定

```bash
# 特定のモデルを指定して起動
npx gemini -m gemini-2.5-flash
```

### 追加ディレクトリの参照

```bash
# 複数ディレクトリを参照に含める
npx gemini --include-directories ../other-project,./docs
```

## 便利なコマンド（対話モード内）

| コマンド          | 説明                                             |
| ----------------- | ------------------------------------------------ |
| `/memory show`    | 読み込まれたコンテキスト（`GEMINI.md` 等）を表示 |
| `/memory refresh` | コンテキストを再読み込み                         |
| `/tools`          | 利用可能なツール一覧                             |
| `/help`           | ヘルプを表示                                     |

## プロジェクト設定

### GEMINI.md

プロジェクトルートの `GEMINI.md` がコンテキストファイルとして機能する。
`@file.md` 参照構文を使い、既存の `.agent/rules/` やドキュメントを SSOT として参照している。

```markdown
# 参照構文の例

@.agent/rules/engineering-behavior.md
@docs/02_guidelines/development-guidelines.md
```

`GEMINI.md` を編集した場合は、対話モード内で `/memory refresh` を実行して反映する。

### .gemini/settings.json

プロジェクト固有の設定ファイル。MCP サーバーの接続設定やテーマ等を管理できる。

## Antigravity との使い分け

| 状況                                | 推奨ツール                                     |
| ----------------------------------- | ---------------------------------------------- |
| 通常の開発作業                      | Antigravity（VS Code統合、ファイル操作が強力） |
| Antigravity の API レートリミット時 | Gemini CLI                                     |
| ターミナルベースの作業              | Gemini CLI                                     |
| コードレビュー・解析                | どちらでも可                                   |
| CI/CD パイプラインでの AI 活用      | Gemini CLI（`-p` オプション）                  |

## トラブルシューティング

### 認証のリセット

認証情報に問題がある場合は、以下で再認証できる。

```bash
# 認証情報をクリアして再認証
npx gemini --login
```

### バージョン確認

```bash
npx gemini --version
```

## 参考リンク

- [Gemini CLI リポジトリ](https://github.com/google-gemini/gemini-cli)
- [認証ガイド](https://github.com/google-gemini/gemini-cli/blob/main/docs/get-started/authentication.md)
- [設定ファイルのリファレンス](https://github.com/google-gemini/gemini-cli/blob/main/docs/get-started/installation.md)
