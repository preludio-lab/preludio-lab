# Lib Directory Guidelines (Shared Utilities)

このディレクトリは **ステートレスなユーティリティ関数** のための場所です。

## 責務 (Responsibilities)

- **Helpers:** 日付フォーマット、文字列操作、バリデーションロジックなど。
- **Constants:** プロジェクト全体の定数設定。

## ルール (DOs)

- **DO** 純粋関数 (Pure Functions) として記述する（副作用を持たせない）。
- **DO** 複雑なロジックには単体テスト (`.test.ts`) を記述する。

## 禁止事項 (DON'Ts)

- **DON'T** Reactコンポーネントを含めない。
- **DON'T** 可能な限り特定のUIフレームワークに依存させない。
