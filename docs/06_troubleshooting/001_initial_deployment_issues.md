# トラブルシューティング: 初回Vercelデプロイ (2025-12-17)

## 概要
PreludioLabのVercel Preview環境への初回デプロイ時に遭遇した問題と、その解決策を記録する。
主な技術スタック: Next.js 15 (Turbopack), Pino (Logging), Vercel.

## 1. ビルドエラー (Pino / Turbopack)

### 現象
ローカルビルドは通るが、Vercel上のデプロイで以下のエラーが発生。
```
Error: Turbopack build failed with 38 errors:
./node_modules/thread-stream/test/ts.test.ts
Missing module type
```

### 原因
- Next.jsのRust製バンドラ **Turbopack** が、`pino` が依存する `thread-stream` パッケージ内のテストファイルや非JSファイルを誤ってバンドル対象として解析しようとした。
- `pino` はWorker Threadを使用するため、バンドラとの相性問題が発生しやすい。

### 解決策
`next.config.ts` にて、Pino関連のパッケージをバンドル対象外（外部パッケージ）として設定する。

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  serverExternalPackages: ["pino", "pino-pretty", "thread-stream"],
};
```
**ポイント**: `pino` だけでなく、内部依存の `thread-stream` も明示的に含めることが重要。

---

## 2. TypeScriptエラー (Agentsディレクトリ)

### 現象
ビルド時に `agents/src/index.ts` で `Cannot find module 'dotenv'` エラーが発生。

### 原因
- プロジェクトルート直下に `agents/` ディレクトリ（AIエージェント用の独立したコード）が存在したが、ルートの `tsconfig.json` がこれを検知対象に含めていた。
- `agents/` はNode.js実行用であり、Next.jsアプリの依存関係（dotenv等）を持たないためエラーとなった。

### 解決策
ルートの `tsconfig.json` から除外する。

```json
// tsconfig.json
{
  "exclude": ["node_modules", "agents"]
}
```

---

## 3. Persistent 404 (Framework Preset)

### 現象
ビルドは成功する（Exit Code 0）が、デプロイされたサイトにアクセスすると全ページで **404 NOT FOUND** が返される。
- 静的ページ（`/ja`等）は生成されているログがある。
- Middlewareを無効化しても解消しない。
- ルート `page.tsx` を作成しても解消しない。

### 原因
- **Vercelのプロジェクト設定ミス**。
- `Settings > Build & Development > Framework Preset` が **"Other"** になっていた。
- これにより、Next.jsとして認識されず、App Routerのルーティング機能がVercelのエッジネットワークに正しくデプロイされていなかった。

### 解決策
- Vercel Dashboardにて Framework Preset を **"Next.js"** に変更し、再デプロイした。
- これにより即座に解決した。

### 学び
- `package.json` があっても、Vercelのインポート設定でフレームワークが正しく自動検知されない場合がある（特にMonorepo構成に近い場合など）。
- 「ビルドは通るが404になる」場合は、コードではなくプラットフォーム設定（Preset, Root Directory, Output Directory）を疑うべき。
