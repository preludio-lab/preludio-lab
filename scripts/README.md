# Scripts Directory Guidelines

このディレクトリ (`/scripts`) には、プロジェクトのビルドプロセス、CI/CD、ローカルの開発支援、データマイグレーション等のために実行されるCLIツールや自動化スクリプトを格納します。

これらのスクリプトは独立して実行されることが多いですが、メインアプリケーションと同等の品質基準およびオブザーバビリティ（保守性・監視性）を満たす必要があります。

## 主要なルール

スクリプトを作成・保守する際は、プロジェクトの共通ガイドライン ( `docs/02_guidelines/development-guidelines.md` ) に従い、以下のルールを厳守してください。

### 1. 構造化ロギングの徹底 (No `console.log`)

スクリプト内での安易な `console.log` や `console.error` の使用は**禁止**します。
代わりに、アプリケーション本体と共通の **`PinoLogger`** を使用し、構造化ログ（JSON形式）として出力してください。

これにより、CI基盤（GitHub Actions等）やログ監視基盤（Datadog, Splunk等）でエラー内容や実行結果を機械的かつ容易にパース・検索できるようになります。

```typescript
// Bad (使用禁止)
console.log('検証が完了しました。');
console.error(`エラー: 行 ${index} のフォーマットが不正です。内容: ${line}`);

// Good (推奨)
import { PinoLogger } from '../src/infrastructure/logging/pino.logger';
const logger = new PinoLogger();

// 成功時のイベントログ
logger.info('検証が完了しました。', {
  event: 'validation_success',
  targetFile: '.zap/zap-rules.conf',
});

// 失敗時（エラー原因やコンテキストをメタデータ `meta` オブジェクトとして付与する）
logger.error('フォーマットエラーが発生しました。', undefined, {
  event: 'validation_failed',
  lineIndex: index + 1,
  lineContent: line,
});
```

### 2. オブザーバビリティを意識したコンテキストの付与

エラーログを出力する際は、単にエラーメッセージ文字列を吐き出すだけでなく、サードパーティのログ基盤で「どのファイルの、どの行で、何が原因で落ちたのか」を瞬時に特定できるよう、`info` や `error` メソッドの引数 (`meta` オブジェクト) に豊富なコンテキスト情報を含めてください。

### 3. 明示的かつ確実な異常終了

スクリプト内でエラー（バリデーション失敗、ネットワークエラー等）が発生し、以降の処理を継続すべきでない場合は、単にログを出力して終わるのではなく、**必ず `process.exit(1)` を呼び出してプロセスを異常終了させてください。**

これにより、`lint-staged` やGitHub Actionsのステップがスクリプトの失敗を正確に検知し、全体のパイプライン（コミットやデプロイ）をブロックすることができます。

```typescript
if (hasError) {
  logger.error('Validation failed.', undefined, { event: 'validation_failed' });
  process.exit(1); // CIパイプラインやコミットフックを確実に停止させる
}
```

### 4. 実行方法

スクリプトはTypeScript (`.ts`) で記述し、`tsx` モジュールを用いて実行することを標準とします。(`package.json` のスクリプト定義を参照)

```json
"scripts": {
    "validate:zap-rules": "tsx scripts/validate-zap-rules.ts"
}
```
