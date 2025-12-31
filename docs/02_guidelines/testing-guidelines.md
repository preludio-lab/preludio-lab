# Testing Guidelines (v2.3 - Global Execution Strategy)

開発ガイドラインで定義された「クリーンアーキテクチャ」のレイヤー構造に基づき、各層のテスト戦略を規定する。

## 1. Testing Philosophy (The Test Pyramid)

**「ドメインロジックの純粋性と堅牢性」** を最優先する。
UIやインフラは変わりやすいため、そこに依存しない `Domain` と `Application` 層のテストカバレッジを厚くする。

## 2. Layer-by-Layer Strategy

### 2.1. Domain Layer (`src/domain/`)

**最も重要。ビジネスルールの正しさを保証するため、極めて高いカバレッジを確保する。**

- **Type:** **Pure Unit Test**
- **Tool:** `Vitest`
- **Strategy:**
  - 外部依存やモック（Mock）は一切使用しない。入力に対する出力が正しいかを検証する。
  - 境界値テスト（Boundary Value Analysis）を重点的に行う。
- **Target:** `Entities`, `Domain Services`
- **Validation:** Domain層では「ビジネスルールの整合性」をテストする。入力値の形式（フォーマット）チェックはここではなく、Application層の責務とする。

### 2.2. Application Layer (`src/application/`)

**ユースケース（処理の流れ）が正しく構成されているかを確認する。**

- **Type:** **Unit Test (with Mocks)**
- **Tool:** `Vitest`
- **Strategy:**
  - `src/domain/repositories` のインターフェースを **Mock化** してテストする（Repositoryの挙動は制御下に置く）。
  - 「正常系」だけでなく「リポジトリがエラーを吐いた場合」などの「異常系」もテストする。
- **Target:** `Use Case` classes, `DTOs`
- **Validation Rule (Strict):**
  - **DTO Test:** `zod` スキーマ定義を含む DTO ファイルに対してテストを作成し、境界値や不正なフォーマットの入力が正しくエラー（`ZodError`）になることを検証する。
  - **Use Case:** バリデーション済みのデータが渡ってくる前提で、ビジネスフローをテストする。

### 2.3. Infrastructure Layer (`src/infrastructure/`)

**外部システム（Supabase, API）との連携が正しく行えるかを確認する。**

- **Type:** **Integration Test**
- **Tool:** `Vitest`
- **Strategy:**
  - **Scope Limitation:** 実際のDB接続を伴うテストはコストが高いため、Unit Testでは**「データ変換ロジック（Mapper）」の検証**に集中する。
    - 例: Supabaseからのレスポンス(Snake Case)が、正しくEntity(Camel Case)に変換されているか。
  - **Mocking:** `supabase-js` クライアント自体をモックし、通信発生を回避する。実際の通信テストは手動またはE2Eで行う。

### 2.4. UI Layer (`src/app/`, `src/components/`)

**見た目、ユーザーインタラクション、およびURL同期の整合性を確認する。**

- **Type:** **Component Test / Hook Test / E2E**
- **Tools:** `React Testing Library (RTL)`, `Vitest`, `Playwright`, `Storybook`

#### Why Vitest/RTL over Playwright Component Testing?

Playwrightにもコンポーネントテスト機能はあるが、以下の理由からVitest/RTLを優先する。

1.  **実行速度**: Node.js上で動作するためフィードバックループが極めて速い。
2.  **AI互換性**: Gemini等のAIエージェントにとって、JSDOMベースのRTLコードは生成精度が高く、学習・修正が容易。
3.  **Hooksテスト**: `renderHook` によるカスタムフック単体テストが最も効率的。

#### Strategy (Role Definitions):

| ツール           | テストの深さ          | ターゲット環境     | 生産性を守るための「割り切り」                                                     |
| :--------------- | :-------------------- | :----------------- | :--------------------------------------------------------------------------------- |
| **RTL (Vitest)** | **ロジック中心**      | **Local / CI**     | 「ユーザーから見た振る舞い」を検証。スタイル(CSS)や複雑なブラウザ挙動は追わない。  |
| **Playwright**   | **導線中心**          | **Vercel Preview** | 主要な画面遷移に限定。**実際のデプロイ環境**でユーザーが目的を達成できるかを検証。 |
| **Storybook**    | **視覚/AIマニュアル** | **Local**          | **AIエージェントへの「指示書」**として活用。エッジケースの視覚確認を効率化。       |

#### Storybook Selective Strategy:

個人開発の生産性を維持するため、すべての部品にStorybookを作成するのではなく、**「状態によって見た目が大きく変わる複雑な部品」**に限定して導入する。

- **Target:** `FilterPanel`, `AudioPlayer`, `ScoreRenderer` 等
- **Value:** 10,000記事のエッジケース（極端に長いタイトル等）をカタログ上で瞬時に確認できるようにする。

- **Specific Testing Patterns:**
  1.  **Debounce (入力遅延) 検証**:
      - `vi.useFakeTimers()` を使用し、指定時間（例: 500ms）経過後に初めて処理が実行されることを厳密に検証する。
  2.  **URL/Navigation (Locale) 検証**:
      - `router.push` の引数に **ロケール（`/ja/..` や `/en/..`）が正しく含まれているか** を必ず検証する（多言語展開時のデグレード防止）。
  3.  **Data Robustness (AI Content)**:
      - 生成AIによる不完全なデータ（メタデータ欠損等）が渡された場合でも、UIがクラッシュせずに代替表示を出せるか（Graceful Failure）のテストケースを必須とする。

- **Implementation Rules:**
  - **Server Component:** Unit Testは作成せず、Playwrightでの表示確認のみとする。
  - **Controller (Server Actions):** `next/navigation` をモック化し、リダイレクト先やバリデーションエラーを検証する。

## 3. Tooling Stack & Configuration

| Category                | Tool           | Scope                                      | Environment    |
| :---------------------- | :------------- | :----------------------------------------- | :------------- |
| **Unit / Integration**  | **Vitest**     | Domain, Application, Infra (Logic & State) | Local & CI     |
| **Component / Catalog** | **Storybook**  | Complex UI Components (**AI Manual**)      | Local          |
| **E2E / Navigation**    | **Playwright** | Critical User Flows (Smoke Test & Locale)  | Vercel Preview |

### 3.1. Scripts & Config

- **Config File:** `vitest.config.ts` (React/TS対応済み), `vitest.setup.ts` (Global Setup)
- **Commands:**
  - `npm test`: 全てのテストを1回実行する。
  - `npm run test:watch`: ウォッチモードでテストを実行する（変更を検知して再実行）。
  - `npm run test:coverage`: カバレッジレポートを生成する。
- **CI Integration:** `ci-check.yml` 内の `Unit Test` ステップで実行される。

## 4. Test Example (Pseudocode)

### Domain Test

```typescript
// Score.test.ts
const score = new Score({ level: 5 });
expect(score.isDifficult()).toBe(true); // 純粋な計算
```

### Application Test (with Locale Check)

```typescript
// useFilterState.test.ts
const mockPush = vi.fn();
// ...
act(() => {
  result.current.setFilter('keyword', 'Mozart');
});

// Validate logic AND locale preservation
expect(mockPush).toHaveBeenCalledWith(
  expect.stringMatching(/^\/en\//), // Locale must be preserved
  { scroll: false },
);
```

## 5. File Location & Naming

テストファイルの配置場所と命名規則を以下の通り規定する。

### 5.1. Unit & Integration Tests (Colocation)

**原則として、テスト対象ファイルと同じディレクトリに配置する（Colocation）。**
ディレクトリを分離すると、ファイルの移動時に追従しづらくなるためである。

- **Location:** 対象ファイルと同じディレクトリ (`src/...`)
- **Naming:** `[対象ファイル名].test.ts` (or `.test.tsx`)
- **Example:**
  - `src/domain/entities/User.ts`
  - `src/domain/entities/User.test.ts`

### 5.2. E2E Tests

E2Eテストはアプリケーション全体を外部から叩くテストであるため、ソースコードとは切り離して管理する。

- **Location:** プロジェクトルート直下の `e2e/` ディレクトリ
- **Naming:** `[機能名].spec.ts`
- **Example:**
  - `e2e/auth-flow.spec.ts`

## 6. Verification Strategy (Non-Functional & Ad-hoc)

自動テストではカバーしきれない非機能要件や、一時的な検証を行う際の戦略。

### 6.1. Performance Verification

定量的な数値目標（Acceptance Criteria）を設けて検証する。

- **Metrics:** 読み込み時間、レンダリング時間、Lighthouseスコア等。
- **Method:**
  - `console.time` / `performance.now()` を一時的に埋め込み計測する（本番ログ自動削除設定の確認必須）。
  - Chrome DevTools の CPU Throttling を使用し、モバイル環境をシミュレートする。
- **Evidence:** スクリーンショットやログ出力を記録し、成果物（Walkthrough）に残す。

### 6.2. Ad-hoc Verification Pages

特定のコンポーネントや挙動を隔離して検証するために、一時的なページを作成する場合のルール。

- **Location:** `src/app/[lang]/_test/` (推奨) または検証専用ブランチを作成する。
  - **Note:** `src/app/test` のようにルート直下に配置すると、`[lang]` の動的ルーティングやMiddlewareと競合して 404 になる場合があるため注意する。
- **Cleanup:** 検証完了後は速やかに削除する。Gitにはコミットしない（または検証用ブランチでのみ管理する）。

### 6.3. Negative Testing (Fault Injection & AI Robustness)

「正常に動くこと」だけでなく、「異常時に正しく失敗すること（Fail Gracefully）」を検証する。

- **Verified Error UI:**
  - 開発中に「強制的にエラーを発生させるボタン」等で、エラーハンドラやトースト表示が機能することを目視確認する。
- **Robustness against AI Content:**
  - 10,000記事規模のAI生成コンテンツでは、一部のデータ欠損や予期せぬフォーマットが混入する可能性がある。
  - **検証項目:**
    - タイトルや説明文が空の場合のフォールバック表示。
    - 不正な日付フォーマットや壊れた画像URLでの挙動。
    - APIエラー時のローディング/エラー表示の持続。
- **Promise Rejection:**
  - 非同期処理の検証では、意図的に Reject させるケースを必ずテストする。
