# App Directory Guidelines (UI Layer - Controller)

このディレクトリは **UI Controller** として機能します。
Next.js App Router (Server Components & Server Actions) を使用して、ユーザーのリクエストを受け付け、Application層を実行します。

## 責務
*   **Routing:** 画面遷移とURLの管理。
*   **Controller (Server Actions):**
    1.  Dependency Injection (DI) を行う（Repositoryの実装をInfraから取得し、UseCaseに渡す）。
    2.  `UseCase.execute()` を呼び出す。
    3.  結果をUIコンポーネントに渡す。

## ルール (DOs)
*   **DO** `_actions/` ディレクトリに Server Actions を集約する。
*   **DO** 具体的なビジネスロジックは書かず、必ず `src/application/` のユースケースを呼ぶ。

## 禁止事項 (DON'Ts)
*   **DON'T** ここでDB操作 (Supabaseなど) を直接行わない。Infra層を経由する。
*   **DON'T** 複雑な分岐条件を書かない。Domain層に移譲する。
