---
title: UseCase実装におけるトランザクション管理とパフォーマンス最適化
date: 2026-02-04
tags: [refactoring, transaction, performance, logging, architecture]
---

# UseCase実装におけるトランザクション管理とパフォーマンス最適化

`CreateWorkUseCase` および `UpdateWorkUseCase` のリファクタリングを通じて得られた、信頼性とパフォーマンスを高めるための実装パターンをまとめる。

## 1. トランザクション管理 (Data Integrity)

### 課題

複数の集約（Aggregate）やテーブル（例: `Work` と `WorkPart`）を同時に更新する場合、途中でエラーが発生するとデータ不整合（Inconsistency）が発生するリスクがある。
特に `Update` 処理において「全削除して再挿入」などの破壊的変更を行う場合、ロールバックなしではデータ消失につながる。

### 解決策: TransactionManagerパターンの適用

ドメイン層に抽象化された `TransactionManager` インターフェースを定義し、ユースケース層でトランザクション境界を明示的に制御する。

```typescript
// src/domain/shared/transaction-manager.interface.ts
export interface TransactionManager {
  transaction<T>(callback: () => Promise<T>): Promise<T>;
}

// src/application/usecase/some.usecase.ts
await this.txManager.transaction(async () => {
  await this.repoA.save(entityA);
  await this.repoB.saveAll(entitiesB);
});
```

これにより、インフラ層（DB実装詳細）への依存を防ぎつつ、アトミックなデータ更新を保証できる。

## 2. N+1問題の解消 (Performance)

### 課題

配列データ（例: 作品の全楽章）を保存する際、ループ内で `save()` を個別に呼び出すと、要素数分のDBラウンドトリップが発生する（N+1問題）。これは特に大量データを扱うバッチ処理や生成AIワークフローにおいて深刻なボトルネックとなる。

### 解決策: saveAllによる一括処理

リポジトリインターフェースに `saveAll(entities: T[]): Promise<void>` を定義し、インフラ層で一括INSERT（Bulk Insert）を実装する。

```typescript
// Loop (Bad)
for (const part of parts) {
  await this.repo.save(part); // N回の通信
}

// Batch (Good)
await this.repo.saveAll(parts); // 1回の通信
```

## 3. 構造化ロギング (Observability)

### 課題

ログメッセージに動的な値を文字列連結（Template Literal）で埋め込むと、ログ解析ツール（Sentry, Datadog, CloudWatch Logs）での検索や集計が困難になる。また、機密情報が含まれるリスクが高まる。

```typescript
// Bad
logger.info(`Updated Work: ${slug} (${id})`);
// -> 検索時に "Updated Work: *" のようなワイルドカード頼みになる
```

### 解決策: Structured Logging

メッセージは固定の静的文字列とし、動的な値はメタデータオブジェクトとして第2引数に渡す。

```typescript
// Good
logger.info('Updated Work Core', { slug, workId: id });
// -> JSONとして出力され、`slug="beethoven/..."` のように正確なキー検索が可能
```

## 4. スプレッド構文による保守性向上 (Maintainability)

### 課題

DTOからEntityへデータをマッピングする際、手動でプロパティを列挙すると、フィールド追加時に修正漏れが発生しやすい上に記述が冗長になる。

### 解決策

スプレッド構文 (`...data`) を活用し、デフォルト値や上書きが必要な項目のみ明記する。

```typescript
const metadata = {
  ...data, // 基本的にすべてコピー
  // 必要な場合のみ上書きやデフォルト値設定
  catalogues: data.catalogues ?? [],
  updatedAt: new Date(),
};
```

---

## 関連資料

- `src/domain/shared/transaction-manager.interface.ts`
- `docs/02_guidelines/development-guidelines.md`
