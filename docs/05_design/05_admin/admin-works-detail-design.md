# 作品詳細・管理画面 (Work Detail Admin UI) 詳細仕様

本ドキュメントは、管理UIにおける**「作品詳細ページ（Work Detail）」**の設計・実装方針を定義します。クリーンアーキテクチャ（Onion）ガイドラインに基づき、堅牢性とスケーラビリティを満たすアーキテクチャ設計およびUI/UXの要件をまとめます。

## 1. ルーティングとURL設計

- **URLパス**: `/[lang]/admin/(protected)/works/[work-id]`
- **識別子の選定方針**:
  - 既存の作曲家管理画面（`/composers/[slug]`）とは異なり、作品管理においてはSlugが変動する可能性や、Slugの衝突リスクを避けるため、**不変のID（UUID等）**をURLパラメータとして採用します。
  - フロントエンドからサーバーへの全てのリクエスト（Server Actions含む）において、この `work-id` をキーとして扱います。

## 2. アーキテクチャとデータフェッチの方針

クリーンアーキテクチャに基づき、ドメインオブジェクト（Entity）はフロントエンド層（Presentation層）には露出させず、Use Case層でDTOに変換します。

### 2.1. Repository層

- **Query（取得）**:
  - `WorkRepository.findByIdWithParts(workId: string)` のようなメソッドを実装します。
  - 内部ではTurso（Drizzle ORM）のRelational Queries（`db.query.works.findFirst({ with: { parts: true } })` など）または明示的なJOINを用いて、Workとそれに従属するすべてのWorkPart、および多言語データ（translations）を**N+1問題を回避しつつ一括取得**します。
  - 作曲家選択UI（コンボボックス）のためのマスターリストは全件取得せず、初期ペイロードを削減するために**非同期オートコンプリート（Async Typeahead / Search UI）**用の軽量な検索クエリ（例: `ComposerRepository.searchByName(query)`）を実装します。
- **Command（永続化・更新）**:
  - トランザクション境界を厳格に管理するため、`TransactionManager` を利用します。
  - Work本体およびWorkPartの作成・更新・削除は、**1つのトランザクション内で一括処理**します。
  - WorkPartの更新方式は、原則としてクライアントから送られたWorkPartの全リストによる**フルリプレイス（Idの有無でInsert/Update/Deleteを判定しバルク処理）**とします。
  - **楽観的排他制御 (Optimistic Locking)**: 複数管理者による同時編集時のLost Updateを防ぐため、リクエストに含まれる `updatedAt` とDB上の最新の `updatedAt` を比較し、不一致の場合は競合エラーをフロントエンドに返却します。
  - **削除のドメイン制約**: フルリプレイスによって送られなかった `WorkPart` IDを削除（Delete）判定する際、将来的に「関連フレーズ（Phrase）」や「音源（Recording）」等から参照されている場合はトランザクションエラー（外部キー制約違反）となるリスクがあります。そのため、事前に（またはDB制約エラーをキャッチして）対象のWorkPartが他エンティティから参照されているかを評価し、**参照が存在する場合は物理削除をブロックしバリデーションエラーを返す（削除不可）**仕様とします。

### 2.2. Use Case層と DTO設計

取得した `Work` と複数の `WorkPart` Entity（およびそれぞれの多言語データ）を集約し、Presentation層用の1つのDTO（`WorkDetailDto`）にマッピングします。

```typescript
// サポート対象言語の型定義（厳密なビジネス要件に基づく）
export type SupportedLanguage = 'ja' | 'en' | 'de' | 'fr' | 'it' | 'es' | 'zh';

// DTOイメージ（概略）
export type WorkDetailDto = {
  id: string; // UUID
  composerId: string;
  composerSlug: string;
  composerName: string; // コンボボックス初期表示用 (Async Typeaheadの初期値として利用)
  slug: string;
  createdAt: string;
  updatedAt: string; // 楽観的排他制御に使用

  // Work本体のメタデータ・基本情報
  era: string | null;
  instrumentation: string | null;
  performanceDifficulty: number | null;
  genres: string[];
  tags: string[];
  instruments: string[];
  timeSignature: { numerator: number; denominator: number; displayString: string | null } | null;

  // 多言語対応データ（Work本体）: フル生成されないケースを考慮し Partial とする
  translations: Partial<
    Record<
      SupportedLanguage,
      {
        title: string;
        titlePrefix: string | null;
        titleContent: string | null;
        titleNickname: string | null;
        description: string | null;
      }
    >
  >;

  // WorkParts（ネストされた配列）
  parts: WorkPartDetailDto[];
};

export type WorkPartDetailDto = {
  id: string; // UUID
  sortOrder: number;
  type: string;
  genres: string[];
  instruments: string[];
  timeSignature: { numerator: number; denominator: number; displayString: string | null } | null;

  // 多言語対応データ（WorkPart）: フル生成されないケースを考慮し Partial とする
  translations: Partial<
    Record<
      SupportedLanguage,
      {
        title: string;
        titlePrefix: string | null;
        titleContent: string | null;
        titleNickname: string | null;
        tempoTranslation: string | null;
      }
    >
  >;
};
```

### 2.3. Presentation層とRevalidation要件

- **Server Componentsによる初期描画**: `[work-id]/page.tsx` において、直接Use Case（`GetWorkDetailUseCase`）を呼び出し、初期レンダリングのパフォーマンスを最適化します。
- **厳密なスキーマバリデーション**: Presentation層とUseCase層の境界（Server Actionsの入り口）で、Zod等のスキーマライブラリを用いて、クライアントから送信される巨大なペイロード（`parts`のネスト構造含む）の全体に対して型検証とビジネス制約のチェックを厳格に行います。
- **データ更新とRevalidation**: 編集フォームからの保存アクション（Server Actions: `updateWorkAction`）が完了した直後に、 Next.jsの `revalidatePath('/[lang]/admin/works/[work-id]')` を実行します。これにより、クライアントにおける複雑なローカルステート管理を排除し、常にサーバーを「Source of Truth」とします。

---

## 3. UI/UX 仕様

### 3.1. Work基本情報の編集

- **作曲者紐付けUI**: 単なる読み取り・テキスト入力ではなく、**非同期検索対応コンボボックス（Async Typeahead / Autocomplete）**として実装します。ユーザーのキーストロークに応じて動的にサーバーから作曲家候補を取得することで、初期ロードのペイロード肥大化を防ぎます。
- **各種音楽的メタデータ**: カタログ番号、調性、テンポ、時代（era）、楽器編成、ジャンル、タグなどを入力・管理します。

### 3.2. WorkPartの統合UI

- **独立ページは作成しない**: WorkPart専用のページ遷移（例: `/works/[id]/parts/[part-id]`）は設けません。
- **インライン・アコーディオン管理**: Workの基本情報タブ内に「構成・楽章 (Parts)」セクションを設け、アコーディオンカードまたはテーブルとモーダル/ドロワーの組み合わせによって、**同一画面内でWorkPartのCRUD操作が完結**するUIとします。
- **一括保存**: WorkPartの追加・変更・削除も、Work本体の「保存」アクションと同時に送信され、Use Case層で一括適用されるようにします。

### 3.3. 多言語対応 (i18n)

- 作曲家管理ページと同様に、入力フォーム内の表示言語を切り替えるトグルタブUI（JA, EN, DE, FRなど）を配置します。
- **一括連動**: 言語タブの切り替え操作により、Work本体の多言語フィールドだけでなく、**すべてのWorkPartアコーディオン内の多言語フィールドも連動して一括で該当言語に切り替わる**仕様とします。（ReactのContext等を用いて言語選択状態を共有します。）

## 4. スコープ外

- **フレーズ（譜例）機能**: 現在未実装のため、今回の対応スコープからは除外（保留）とします。UI上のプレースホルダー等の表示に留めます。
