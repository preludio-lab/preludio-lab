# Domain Layer Guidelines (src/domain)

**最も重要なレイヤー。外部への依存は一切禁止。**
ここに定義されたルールがプロジェクトの全てを決定する。

## ディレクトリ構成
*   `entities/`: アプリケーションで扱うデータ構造とビジネスルール (e.g. `User`, `Score`)。
*   `repositories/`: データの永続化に関するインターフェース定義 (e.g. `IUserRepository`)。
*   `services/`: エンティティ単体では完結しないドメインロジック (e.g. `ScoreAnalysisService`)。

## ルール (Strict)
*   **No Dependencies:** UI, Application, Infrastructure への依存 (`import`) は絶対に禁止。
*   **Pure TypeScript:** 基本的には純粋な TypeScript クラス/インターフェースのみで構成する。
