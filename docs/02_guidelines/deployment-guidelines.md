# Deployment & CI/CD Guidelines

デプロイメントフロー、Gitブランチ戦略、およびCI/CDパイプラインに関するガイドライン。

## 1. Git Branching & Workflow Strategy

**GitHub Flow** を採用し、シンプルかつ高速なリリースサイクルを維持する。

### 1.1. Branch Rules

- `master`: **Protected Branch.** 直接コミット禁止。PRマージのみ受け付ける。常にデプロイ可能な状態（Deployable）を維持する。
- `feat/{issue-id}-{slug}`: 機能追加。
  - **Note:** Issue ID (`#123`) を含めることで、GitHub上でIssueとPR/Branchが自動的に紐付き、追跡性（Traceability）が向上する。
- `fix/{issue-id}-{slug}`: バグ修正。
- `docs/{slug}`: ドキュメント修正。

### 1.2. Pull Request (PR) Policy

- **Template:** プロジェクト規定のPRテンプレート（`.github/pull_request_template.md`）を使用する。
  - **Summary:** 何をしたか。
  - **Related Issues:** 関連するIssue番号 closes #123.
  - **Verification:** どうやって動作確認したか（スクショ、動画、コマンド）。
- **Language:** 原則として日本語を使用する。タイトル、概要（Description）、コメント等は日本語で記述すること。
- **Review:** 最低1名の承認（Approve）を必須とする。
- **Merge Strategy:** **Squash & Merge** を原則とする。
  - **Reason:** 開発中の試行錯誤（typo修正など）の履歴を1つのコミットにまとめ、`master` の履歴を「機能単位」でクリーンに保つため。

### 1.3. Commit Message Convention

- **Prefix:** `naming-conventions.md` で定義されたPrefix (`feat:`, `fix:`, etc.) を必ず付与する。
- **Language:** 日本語。
- **Scope:** 変更範囲が明確な場合は `feat(ui):` のようにスコープを記述する。

## 2. CI/CD Operations

- **CI:** GitHub Actionsにより、Lint, TypeCheck, Unit Test を自動実行。
- **CD:** Vercel Integrationにより自動デプロイ。

## 3. Deployment & Configuration Guidelines

VercelへのデプロイおよびNext.jsの設定におけるベストプラクティス。

### 3.1. Vercel Project Settings

- **Framework Preset:** 必ず **"Next.js"** を指定する。"Other" 等になっていると、ビルドは成功してもApp Routerのルーティングが機能せず 404 エラーとなる。
- **Root Directory:** `package.json` がリポジトリ直下にある場合、デフォルト（`.` または空欄）を使用する。

### 3.2. Next.js Configuration (Turbopack)

Next.js 15+ の Turbopack は Rust ベースの高速バンドラだが、一部のネイティブモジュールや Worker Thread を使用するライブラリと互換性問題を起こす場合がある。

- **Pino / Thread-stream:** `next.config.ts` の `serverExternalPackages` に明示的に追加し、バンドルから除外する。
  ```ts
  const nextConfig: NextConfig = {
    serverExternalPackages: ['pino', 'pino-pretty', 'thread-stream'],
  };
  ```

### 3.3. TypeScript Configuration

- **Exclusions:** Next.js アプリケーションの依存関係に含まれない独立したスクリプトディレクトリ（例: `agents/`）は、ルートの `tsconfig.json` の `exclude` に追加する。
  - **Reason:** Next.js ビルドプロセスがそれらのファイルを型チェックしようとし、アプリ側の依存関係（`dotenv` 等）の欠落によりビルドエラーになるのを防ぐため。

### 3.4. Preview Environment Strategy

- **Branch-based Previews:** VercelはPR作成有無にかかわらず、**Pushされた全てのブランチ**に対してプレビュー環境を構築する。
  - **Policy:** これを標準動作として受け入れる。「PR作成前の動作確認」が可能になるメリットを活かすため、特定のブランチのみにビルドを制限する設定は行わない。
  - **Cost:** Hobby Plan / Pro Plan 共に、アクセスされなければ課金（帯域・Function実行）対象にはならないため、デプロイ数が増えても問題ない。
