# PreludioLab タスクリスト

Status: `[/]` 進行中

## Phase 1: 要件定義・設計 (Requirements & Design)

- [x] **1.1 要件定義の精緻化**
  - [x] `01_specs/business-requirements.md` をブラッシュアップし、要件ID (`REQ-BIZ-XXX`) を付与
  - [x] `01_specs/technology-requirements.md` をブラッシュアップし、要件ID (`REQ-TECH-XXX`) を付与
  - [x] `01_specs/ui-ux-requirements.md` をブラッシュアップし、要件ID (`REQ-UI-XXX`) を付与
  - [x] `01_specs/content-requirements.md` をブラッシュアップし、要件ID (`REQ-CONT-XXX`) を付与
  - [x] 各要件に対する「完了条件（Acceptance Criteria）」の記述
  - [x] **[Update]** AIデザインプロセス (`REQ-UI-PROCESS`) の追加
  - [x] **[Update]** Designer Agent (`REQ-TECH-AGENT-007`) の追加

- [x] **1.2 基本設計**
  - [x] **ルーティング設計:** `app/[lang]/` 配下のURL構造とページ遷移の定義
  - [x] **記事データ設計:** MDX Frontmatterのスキーマ定義 (Title, Composer, Difficulty, Tags...)
  - [x] **コンポーネント設計:** UIパーツ（Atoms/Molecules）と機能コンポーネント（Organisms）のリストアップ
  - [x] **デザイン仕様策定:** `docs/05_design/ui-design.md` (Tokens, Changeability) の作成
  - [x] **エージェント設計:** AIエージェント（Musicologist, Translator, _Designer_）の出力フォーマットとインターフェース定義

## Phase 2: 環境構築 (Environment Setup)

- [x] **2.1 ガイドライン策定**
  - [x] `docs/02_guidelines/naming-conventions.md` (命名規則)
  - [x] `docs/02_guidelines/score-notation-guidelines.md` (楽譜表記)
  - [x] `docs/02_guidelines/localization-guidelines.md` (翻訳・ローカライズ)
  - [x] `docs/02_guidelines/prompt-engineering-standard.md` (AIプロンプト)
  - [x] `docs/02_guidelines/development-guidelines.md` (開発)
  - [x] `docs/02_guidelines/testing-guidelines.md` (テスト)
  - [x] **[Final Review]** Ensure all guidelines are consistent (Clean Architecture).

- [x] **2.2 プロジェクトセットアップ**
  - [x] GitHubリポジトリの作成とRemote設定
  - [x] Next.js アプリの初期化 (App Router, TypeScript)
  - [x] Tailwind CSS & デザインシステムの実装 (Variables in `globals.css`, Fonts in `layout.tsx`)
  - [x] ESLint & Prettier の設定

- [x] **2.3 インフラ構築**
  - [x] Vercel プロジェクトのセットアップ
  - [x] Supabase プロジェクトのセットアップ (Auth: SSO Only)
  - [x] **ドメイン設定:** `preludiolab.com` の取得とVercelへの紐付け

- [x] **2.4 DevOps & QA基盤構築**
  - [x] GitHub Actions Workflow作成: `ci-check.yml` (Lint / TypeCheck / Unit Test)
  - [x] Vitest テスト環境のセットアップ

- [x] **2.5 AIエージェント環境構築 (AI Env)**
  - [x] `agents/` ディレクトリの初期化 (package.json, tsconfig.json)
  - [x] Google Generative AI SDK (Gemini) のインストール
  - [x] GitHub Actions Workflow作成: `agent-runner.yml` (Manual/Schedule Trigger)

## Phase 3: MVP / プロトタイプ開発 (Prototype)

- [x] **3.1 静的モックの実装**
  - [x] トップページのデザイン・実装 (Hardcoded + Design Tokens)
  - [x] 記事詳細ページのレイアウト確認 (Dummy Data + Skeleton)
  - [x] 楽譜・プレイヤーのプレースホルダー配置

- [x] **3.2 デプロイ・動作確認**
  - [x] Vercelへの初回デプロイ (Framework Preset, Pino Config Fixed)
  - [x] サーバーサイドログ (Pino) の復旧と確認
  - [x] レスポンシブ挙動の確認

## Phase 4: コア機能開発 ("Lab" Components)

- [x] **4.1 楽譜レンダリングエンジン** (Ref: `REQ-TECH-SCORE`)
  - [x] 要件と完了条件（Acceptance Criteria）の定義
  - [x] `ScoreRenderer` コンポーネントの実装 (`abcjs`)
  - [x] SVGレンダリングパフォーマンスの検証
  - [x] スケルトン表示 (Loading State) の実装 (Ref: `REQ-UI-006-01`)

- [x] **4.2 オーディオプレイヤー統合** (Ref: `REQ-TECH-AUDIO`)
  - [x] 要件と完了条件の定義
  - [x] `AudioPlayer` コンポーネントの実装 (YouTube IFrame API)
  - [x] UIモード実装: Mini Player (Footer) & Focus Mode (Ref: `REQ-UI-004-02`)
  - [x] 楽譜との同期ロジックの実装（Click to Play / StartTime指定の実装）

- [x] **4.3 多言語MDX記事システム & 制作フロー**
  - [x] MDXディレクトリ構成の設計 (`content/[lang]/...`)
  - [x] MDX Loader / Parser の実装
  - [x] Pagefind 検索の実装 (Ref: `technology-requirements`)
  - [x] 目次 (TOC) 自動生成機能の実装 (Ref: `REQ-UI-005-02`)
  - [x] シリーズナビゲーション (Previous/Next/Index) の実装 (Ref: `REQ-CONT-SERIES`)
  - [x] コンテンツパイプラインの定義: Agent出力(MDX記事) -> Git PR -> Deployの流れを検証 (Manual Build Verified)

- [x] **4.4 アーキテクチャ・リファクタリング (Architecture Refactoring)**
  - [x] **Score機能のClean Architecture化**
    - [x] Domain (Score entity), Infra (AbcMetadataParser), UI (ScoreFeature) の責務分離
    - [x] `ScoreComponent` の純粋化（ABC依存の排除）および `WorkScoreAdapter` へのロジック移動
  - [x] **メタデータ構造の刷新**
    - [x] `videoId` 依存の廃止と汎用 `src` への移行
    - [x] 全MDXコンテンツのフォーマット更新 (`%%audio_src`)
  - [x] **プレイヤーURL生成ロジックの整理**
    - [x] `YouTubeAdapter` (Embed) と `PlayerLinkHelper` (Watch URL) の分離

## Phase 5: アプリケーション機能実装と詳細化 (Web Application Implementation)

- [x] **5.1 多言語対応の実装 (i18n UI/UX)**
  - [x] **[準備]** 検証用ダミーデータの用意
    - [x] i18n動作確認用の多言語MDX記事（日・英・他）を作成し配置
  - [x] **[仕様策定]** 多言語ルーティング・辞書スキーマ・**SEO (`hreflang`/JSON-LD)** の定義
    - [x] URL構造（`/[lang]/...`）の決定と、辞書ファイル（JSON）の型定義（TypeScript）
    - [x] 言語切り替えUI (Language Switcher) の配置とインタラクション設計
    - [x] 構造化データ（JSON-LD）の共通スキーマ設計
  - [x] **[実装]** 多言語ルーティングとUIの実装
    - [x] Middlewareによる言語検出とリダイレクトの実装
    - [x] ヘッダーへの `LanguageSwitcher` コンポーネントの実装
    - [x] UI共通パーツ（ナビゲーション、ボタン等）の翻訳対応
  - [x] **[テスト・動作検証]** 言語切り替え時の挙動確認
    - [x] ページ遷移時の言語維持、404ページの多言語対応、メタデータの言語不整合チェック
  - [x] **[リファクタリング]** i18nロジックの共通化
    - [x] `getDictionary` 関数の最適化、翻訳漏れを検知する静的チェックの導入

- [x] **5.2 オーディオプレイヤーのコンポーネント化 (Player Componentization)**
  - [x] **[仕様策定]** プレイヤー抽象化レイヤーの定義
    - [x] `ScoreRenderer` からの分離方針と、`AudioManager` (Context) の設計
    - [x] Props設計: `src`, `startTime`, `onTimeUpdate` などのインターフェース定義
  - [x] **[実装]** `AudioPlayer` コンポーネントの独立化
    - [x] Shared Component への移動 (`src/components/features/player/`)
    - [x] Mini Player (Footer) との連携ロジックの再実装
  - [x] **[テスト・動作検証]** 独立再生と同期再生の検証
    - [x] 楽譜連動モードと、単独再生モード（BGM）の動作確認
  - [x] **[リファクタリング]** 既存コードへの適用
    - [x] `ScoreRenderer` 内のプレイヤー呼び出しを新コンポーネントへ置き換え

- [x] **5.3 ホームページの実装 (Dynamic Homepage)**
  - [x] **[仕様策定]** データフェッチ戦略とサイドバー構造の定義
    - [x] "Featured Work" の選定基準とデータ取得範囲
    - [x] サイドバー（Listening Guide/Player Widget）の配置設計とMDX連携仕様
    - [x] 各セクションのUIレイアウトおよびスクロール演出（Framer Motion）の設計
  - [x] **[実装]** 動的コンテンツとサイドバーの実装
    - [x] `Featured Work` セクションへの最新MDXデータの流し込み
    - [x] サイドバーウィジェット（Listening Guideプレビュー等）の実装
    - [x] Discoverカテゴリ（Analysis, Composers等）への遷移ロジック
    - [x] スクロールアニメーション（Framer Motion等）による没入感の演出
  - [x] **[テスト・動作検証]** 表示パフォーマンスとレスポンシブの検証
    - [x] LCP（Largest Contentful Paint）の計測、モバイル実機での「Discover」カードの操作性確認
  - [x] **[リファクタリング]** ホームページ専用コンポーネントのクリーン化
    - [x] 巨大になりがちな `page.tsx` の Organisms 単位への分割

- [x] **5.4 一覧ページの実装 (Works / Composers Index)**
  - [x] **[仕様策定]** フィルタリング・ソート仕様の策定
    - [x] 難易度、時代、楽器などのフィルター項目と、URLクエリパラメータとの連動設計
    - [x] 一覧グリッドおよびフィルターパネルのレスポンシブUI/UX設計
    - [x] **空状態 (Empty State)** のUI定義（検索ヒット0件時の表示）
    - [x] **サムネイル自動解決ロジック** の定義（YouTube `maxresdefault.jpg` 優先、404時に `hqdefault.jpg` へフォールバックするロジック）
  - [x] **[実装]** 一覧ページと自動サムネイル
    - [x] `Works`/`Composers` 一覧のグリッドレイアウト実装
    - [x] **Default YouTube Artwork** ロジックの実装（解像度優先順位付き自動適用）
    - [x] ローディング中のスケルトン表示の実装
  - [x] **[テスト・動作検証]** 大量データ時の挙動確認
    - [x] 100件以上の記事がある想定でのスクロール挙動、フィルタリングの正確性検証
  - [x] **[リファクタリング]** フィルターロジックの分離
    - [x] 検索・絞り込みロジックを Custom Hook（`useFilter`）へ抽出し、保守性を向上

  - [x] **5.5 データベース記事管理の構築 (Database Article Management) [Completed]**
    - [x] **[環境構築]** データベース・インフラのセットアップ
      - [x] **Supabase**: 認証およびコアデータ用プロジェクトの作成
      - [x] 環境定義: 本番環境（Single DB）とブランチ機能（Fork/Staging）の運用方針策定 (Done)
    - [x] **[仕様策定]** DBスキーマとMDX Split-Storage Model
      - [x] Master: MDX / Index & Vector: Database という役割分担の定義
      - [x] テーブル設計 (`articles`, `works`, `composers`, `embeddings`)
      - [x] **ベクトルデータの最適化**: Embeddingsの次元数
    - [x] **[実装] Player Domain & Architecture Update**
      - [x] **Player Domain**: `src/domain/player` のブラッシュアップ（PlaybackState, Playerエンティティの最終化）
      - [x] **Repository Interfaces**: 各ドメインのリポジトリ定義 (`src/application`)

- [/] **5.6 STEP 1: データインフラの物理構築 (The Foundation)**
  - [x] **[基盤]** Turso テーブル作成 (All Domains)
    - [x] Drizzle ORM スキーマ定義 (`src/infrastructure/database/schema`)
    - [x] 全ドメイン（Articles, Works, Composers, Scores, Recordings）のテーブル作成 (`drizzle-kit push`)
  - [x] **[基盤]** Cloudflare R2 バケット作成
    - [x] R2利用仕様の策定とドキュメント化 (`docs/05_design/storage-design.md`)
    - [x] バケット `preludiolab-storage` の作成とアクセス権限設定
    - [x] CDN Proxy Worker (`cdn-proxy`) の実装と配備準備
    - [x] **[検証]** ユーザーによる実機再生確認 (最小構成にて成功)
  - [x] **[準備]** 初期データ移行スクリプトの作成
    - [x] ローカルMDXファイルの解析 (Frontmatter + 本文)
    - [x] 本文データの R2 へのアップロード (完了)
    - [x] マスタデータ（Composer, Works）の生成ワークフロー実装（Json at GitHub）
    - [ ] マスタデータのTursoへのINSERTワークフロー実装
    - [ ] ArticleメタデータのTursoへのINSERTワークフロー実装
    - [ ] 検索のためのEmbeddingの生成ワークフロー実装
    - [ ] EmbeddingのTursoへのINSERTワークフロー実装

- [x] **5.7 STEP 2: インフラ層の実装 (Infrastructure Layer)**
  - [x] **[実装]** Clientセットアップ
    - [x] Turso Client & R2 Client の環境変数設定と接続確立
  - [x] **[実装]** Repository実装
    - [x] `SqliteArticleRepository`: Turso用。SQL結果のDomain Entityへのマッピング (Hydration)
    - [x] `R2ContentRepository`: R2からのMDX本文フェッチ処理
  - [x] **[実装]** 統合Repository
    - [x] メタデータ(DB)と本文(R2)を結合して `Article` エンティティを返す統合リポジトリの実装

- [x] **5.8 STEP 3: アプリケーション層とUIの結合 (Integration)**
  - [x] **[実装]** Use Casesの実装
    - [x] `GetArticle(slug)`, `GetLatestArticles(limit)` 等の参照系ユースケース実装
  - [x] **[実装]** Server Actions / RSC への接続
    - [x] 既存ページ (`page.tsx`) のデータ取得ロジックを Use Case 経由に書き換え
  - [x] **[検証]** 表示確認
    - [x] ローカル環境でのデータ取得・レンダリング確認

## Phase 6: セキュリティテストとパフォーマンスチューニング

- [ ] **6.1 セキュリティテストと脆弱性診断の自動化 (Security Analysis)**
  - [ ] **[SAST]** **GitHub CodeQL** のワークフロー統合（コードスキャン）
  - [ ] **[SCA]** **GitHub Dependabot** による依存関係の脆弱性自動検知とPR作成の有効化
  - [ ] **[DAST]** **OWASP ZAP (GitHub Action)** による動的診断環境の構築
    - [ ] Vercel Preview URLに対して自動実行するスキャンシナリオの実装
  - [ ] **[秘密情報]** **Secret Scanning** の有効化（APIキー等の誤コミット防止）

- [ ] **6.2 パフォーマンス耐久テストと最適化の極致 (Performance & Asset Optimization)**
  - [x] **[基盤]** **Cloudflare Images / R2** の導入。画像アセットの管理・配信を統合。
  - [x] **[実装]** `next/image` と Cloudflare を連携させた、デバイス・通信環境別の画像最適化・キャッシュ戦略の実装
  - [ ] **[計測]** Vercel Speed Insights / Lighthouse による Core Web Vitals (LCP, CLS, TBT) の定量的モニタリング
  - [ ] **[負荷テスト]** **k6** 等を用いた、同時アクセス時のAPI応答性能およびDB負荷の検証
  - [ ] **[最適化]** 1万記事規模を見据えた ISR (Incremental Static Regeneration) と エッジキャッシュ戦略の最終調整
  - [ ] **[ボトルネック解消]** スロークエリの特定とDBインデックスの最適化
  - [ ] **[チューニング]** Vercel Edge Runtime / Cache Control ヘッダーの最終最適化

- [ ] **6.3 オフライン体験とグローバル基盤の強化 (PWA & Global Infrastructure)**
  - [ ] **[実装]** **PWA (Progressive Web App)** 対応。モバイルホーム画面への追加とオフラインキャッシュ（楽譜・音源）の検討。
  - [ ] **[最適化]** **Edge Config & SWR** パターンの適用による、グローバル規模での低遅延アクセス（瞬時の没入体験）の実現。

- [ ] **6.4 E2Eテストの導入と実装 (Playwright)**
  - [ ] **[準備]** Playwrightの導入と初期設定（Mobile/PCブラウザ等）
  - [ ] **[インフラ]** Vercel Preview環境を自動検知してテストを実行するGitHub Actionsの構築
    - [ ] PR/Push時にデプロイ完了を待機し、動的なPreview URLに対してテストを実行するロジックの実装
  - [ ] **[実装]** 主要ユーザーフロー（閲覧、言語切り替え、音源再生確認）のテストシナリオ実装
  - [ ] **[運用]** テスト失敗時のレポート自動生成とGitHub上での可視化

## Phase 7: AIエージェント開発 ("Brain") & コンテンツ量産

- [ ] **7.1 コンテンツ生成エージェントワークフロー (Content Generation Agent Workflow)**
  - [ ] **[設計]** AIエージェントワークフロー設計 (複数エージェントによる共同制作)
  - [ ] **[仕様策定]** 分析・生成プロンプトの要件定義
    - [ ] 楽曲構造分析およびテキスト解説生成のプロンプト設計要件
  - [ ] **[Tools]** Core Toolsの実装 (e.g. `StructureAnalyzer`, `ArticleFormatter` etc.)
  - [ ] **[実装]** オーケストレーター実装: `agents/src/index.ts` (Gemini API呼び出し制御)
    - [ ] **API Cost Circuit Breaker** の実装
  - [ ] **[サブタスク] 品質保証ワークフローの統合 (Quality Assurance Integration)**
    - [ ] **事実確認**: 作品番号、成立年、調性が公式DBと一致するか
    - [ ] **音楽的一貫性**: 解説文の内容と提示された譜面・譜例との整合性チェック
  - [ ] **[実装]** 管理UI実装 (Optional)
  - [ ] **[テスト・動作検証]** 生成品質の検証
    - [ ] テスト: モーツァルト「ピアノ協奏曲第20番ニ短調」を題材とした解説テキスト生成品質検証

- [ ] **7.2 マスターデータ生成エージェントワークフロー (Master Data Generation Agent Workflow)**
  - [ ] **[設計]** AIエージェントワークフロー設計
  - [ ] **[Tools]** Core Toolsの実装 (e.g. `ComposerFetcher`, `TursoUpsertTool` etc.)
  - [ ] **[実装]** 作曲家データ作成ワークフロー (Json -> Turso)
  - [ ] **[実装]** 作品データ作成ワークフロー (Json -> Turso)
  - [ ] **[実装]** 管理UI実装 (Optional)

- [ ] **7.3 翻訳エージェントワークフロー (Translator Agent Workflow)**
  - [ ] **[設計]** AIエージェントワークフロー設計
  - [ ] **[仕様策定]** 翻訳ルールとトーン＆マナーの定義
    - [ ] 多言語翻訳プロンプトの要件 (Tone & Style Guide) および用語集の整備
  - [ ] **[Tools]** Core Toolsの実装 (e.g. `GlossaryLookup`, `TranslationValidator` etc.)
  - [ ] **[実装]** 翻訳Orchestratorの実装 (Parallel Execution)
  - [ ] **[実装]** 管理UI実装 (Optional)
  - [ ] **[テスト・動作検証]** 各言語の翻訳品質検証
    - [ ] 主要言語 (EN, ES, DE, FR, IT, ZH) の出力検証

- [ ] **7.4 譜例コンテンツ・音源管理ワークフロー (Media Asset Workflow)**
  - [ ] **[設計]** AIエージェントワークフロー設計
  - [ ] **[仕様策定]** 最適なレンダー構成の検討
    - [x] **Score Snippet Strategy**: MusicXML対応、Verovio等のレンダリング手法、SSGによるSVG化とキャッシュ配置も含めた、ユーザー体験と保守運用性を考慮した最適な構成を検討する。
  - [ ] **[Tools]** Core Toolsの実装 (e.g. `ScoreRenderer`, `YouTubeSearchTool` etc.)
  - [ ] **[実装]** 生成・検証システムの構築
    - [ ] **Visual Verification**: 生成された譜面を画像化/レンダリングして即座に品質確認できるフローの構築。
    - [ ] エラー修正ループ（Self-Correction）のプロンプト実装
  - [ ] **[実装]** 音源選定・キュレーションの自動化
    - [ ] 自動収集検索クエリ（YouTube Data API）の設計
    - [ ] **Human-in-the-Loop選定フロー**: AIが推奨リストを出し、人間が最終承認する管理画面またはCLIツールの整備
  - [ ] **[実装]** 管理UI実装 (Optional)
  - [ ] **[検証]** 複雑な楽曲での生成テスト

- [ ] **7.5 記事コンテンツ量産体制の構築と実行 (Article Operations)**
  - [ ] **[仕様策定]** コンテンツ戦略とパイプライン定義
    - [ ] 初回リリース用コンテンツ選定 (Target: 10-20 articles for Launch)
    - [ ] コンテントマップ作成: Pillar Content (没入感), Guide Content (入門), Niche Content (専門性), Utility Content (実用) のバランス設計
  - [ ] **[実装]** パイロット・バッチ生成の実行
    - [ ] エージェントによるパイロット記事 5本生成（統合テスト）
    - [ ] バッチ処理による記事大量生成
    - [ ] 画像・メディアアセットの半自動生成 (OGP, Analysis Diagrams)
  - [ ] **[実装]** 管理UI実装 (Optional)
  - [ ] **[テスト・動作検証]** 品質レビューと公開前チェック
    - [ ] 人手による品質レビュー (Music Theory, Notation, Translation, Audio Checks)
    - [ ] リンク切れ・レイアウト崩れの最終チェック
  - [ ] **[リファクタリング]** プロセス改善とプロンプトチューニング

- [ ] **7.6 品質保証エージェントワークフロー (QA Automation)**
  - [ ] **[Tools]** Core Toolsの実装 (e.g. `BrokenLinkChecker`, `ContentConsistencyChecker` etc.)
  - [ ] **[実装]** 自動巡回チェック・フェイルオーバー
    - [ ] **リンク生存**: YouTube動画の削除や著作権失効の自動チェック
    - [ ] **自動フェイルオーバー**: リンク切れ検知時に `is_default` 音源を代替ソースへ自動切り替えするロジックの実装
  - [ ] **[実装]** 異常検知時の通知・レポート機能

## Phase 8: ローンチに向けた機能拡充とリファクタリング

- [ ] **8.1 多言語ルーティング (i18n) の精緻化**
  - [ ] ブラウザ言語の検知と、特定の言語を最上位にプロモートするブラウザロケール連動ロジックの実装

- [ ] **8.2 シリーズ機能の実装 (Content Series)**
  - [ ] **[DB設計]** `series` テーブルおよび `series_items` (多対多) のスキーマ設計
  - [ ] **[UI実装]** シリーズインデックスページ（特集一覧）の実装
  - [ ] **[UI実装]** 各楽曲ページにおける「前の曲 / 次の曲」スマートナビゲーションの実装
    - [ ] 同一シリーズ内での順序を考慮したページ遷移
  - [ ] **[基盤]** **共通ウィジェット・フレームワーク**: サイドバー用の `ContentCard` 拡張 (Vertical/Horizontal) と、再利用可能なウィジェット配置基盤の構築

- [ ] **8.3 AIレコメンド機能と発見的探索 (AI Recommendation & Discovery)**
  - [ ] **[基盤] 検索・RAG 統合基盤の構築**
    - [ ] Turso `libsql-vector` を利用したベクトル検索用インデックスの構築
    - [ ] **Vector-RAG による記事整合性管理**: Tursoのベクトル検索を利用し、過去の記事や関連楽曲をコンテキストとして動的に取得する RAG システムの構築
    - [ ] 移行スクリプトへの Embedding 生成 (Gemini API) 追加
  - [ ] **[ロジック]** 同一作曲家・同一楽器・同一時代の「重み付け」アルゴリズムの実装
  - [ ] **[UI実装]** 検索 UI・結果プレビューの実装
  - [ ] **[UI実装]** **推薦理由の可視化 (Explainable AI)**: 「なぜこの曲がおすすめなのか」を提示する UI の実装
  - [ ] **[実験的機能]** **AIキュレーション・コレクション**: 「雨の日に聴きたい」等の文脈に基づいた自動パッケージ化機能

- [ ] **8.4 プレイヤーの高度化 (Advanced Player Features)**
  - [ ] **[実装]** `Player` ドメインと UI の最終統合
  - [ ] **[実装]** 録音データ再生の高度なテストと最適化

- [ ] **8.5 ユーザーインタラクションとエンゲージメント設計 (Interaction & Engagement)**
  - [ ] **[認証・基盤]** Supabase Auth（SSO/SNS認証）の導入と RLS (Row Level Security) によるユーザーデータ保護
  - [ ] **[LIKE機能]** 楽曲へのLIKE機能の実装。Optimistic Updates（楽観的更新）による即時フィードバック。
  - [ ] **[マイライブラリ]** 「あとで読むリスト」や「視聴履歴のビジュアル化」による再訪動機の創出
  - [ ] **[分析・計測]** Umami または Posthog の導入、およびPV・音源再生イベントのトラッキング設計
  - [ ] **[ランキング]** Supabase Edge Functions による集計済みPVデータのランキング掲示
  - [ ] **[ソーシャル発見]** **Social Highlights (Heatmap)**: どの譜例がよく再生されているかをスコア上に表示する機能
  - [ ] **[高度化]** パーソナライズ・インサイト（ユーザーの好みに合わせた独自の楽曲提案ワークフロー）
  - [ ] **[収益化準備]** プレミアムゲートの設計（特定コンテンツや高品質アセットの会員限定化）

- [ ] **8.6 最高のユーザー体験を実現するためのサイトデザインの清廉化 (Premium UX & Design)**
  - [ ] **[アニメーション]** **Framer Motion** を用いた、ページ遷移や譜例表示時の滑らかなマイクロインタラクションの実装
  - [ ] **[デザイン]** デザインシステムの再定義。没入感を最大化するタイポグラフィ、カラーパレット、余白の「清廉化」
  - [ ] **[没入感]** 音源再生とUIアニメーション（波形、プログレスバー等）のさらなる統合

## Phase 9: Pre-Launch Marketing & Growth Foundation (Acquisition - Pre)

- [ ] **9.1 Pre-Launch Asset Creation**
  - [ ] **[実装]** シンプルなランディングページ (Teaser LP) の公開
    - [ ] Vercel + Supabase Auth でメール登録フォーム（Waitlist）のみ機能するLPを作成し、ドメインのエイジングを開始する。
  - [ ] **[実装]** SNS配信用アセットの自動生成パイプライン
    - [ ] `abcjs` で描画された「美しい譜例」を画像化し、SNSでBuild in Publicを行うためのワークフロー整備。

- [ ] **9.2 Viral Mechanics Implementation**
  - [ ] **[実装]** Dynamic OGP Generation (Shareability)
    - [ ] 楽曲タイトル、作曲家、譜例の一部を合成したOGP画像を、各言語ごとに `@vercel/og` を用いて決定論的に自動生成する。
  - [ ] **[実装]** 構造化データ (JSON-LD) の完全実装
    - [ ] `MusicComposition`, `MusicRecording` スキーマを埋め込み、Googleのリッチリザルト表示を狙う。

- [ ] **9.3 Technical SEO Foundation**
  - [ ] **[実装]** sitemap.xml & Robots.txt の構成
  - [ ] **[実装]** リンク切れ監視 (Dead Link Monitor) のセットアップ

- [ ] **9.4 マネタイズ戦略の具体化 (Monetization Strategy)**
  - [ ] **[準備]** アフィリエイト・プラットフォームの選定と登録（Amazon, Sheet Music Plus, Henle Urtext等）
  - [ ] **[自動化]** 楽曲メタデータ（作曲家・作品番号）に基づく商品リンクの自動マッチング・キャッシュロジックの実装
  - [ ] **[UI実装]** 信頼性を損なわない「推奨楽譜」セクションのデザインと実装
    - [ ] 解説文の中での自然なアフィリエイト・コンテキスト配置
  - [ ] **[UI実装]** Apple Music / Spotify 等の音源ウィジェットの統合。フル試聴体験の提供。
  - [ ] **[基盤]** プレミアム会員限定機能（高品質PDF出力、詳細分析チャート等）への将来的な拡張を見据えたDB/Auth設計

## Phase 10: 検証・ローンチ (Launch)

- [ ] **10.1 最終検証**
  - [ ] パイロット記事（Pillar Content）の実機検証
  - [ ] クロスブラウザ確認 & モバイルレスポンシブ確認
  - [ ] **[セキュリティ]** 脆弱性診断 (OWASP Top 10) の実施

- [ ] **10.2 ローンチ実行**
  - [ ] パブリックリリース (Vercel Production Deploy)
  - [ ] Product Hunt, Hacker News, Reddit (r/classicalmusic) へのShowcase投稿

## Phase 11: ローンチ後の成長と収益化 (Post-Launch Growth & Monetization)

- [ ] **11.1 コミュニティ・エンゲージメント (Community Engagement)**
  - [ ] **[実装]** ユーザー機能（いいね / お気に入り / 履歴）の実装
  - [ ] **[実装]** 誤訳報告機能 (Translation Feedback Loop) の実装

- [ ] **11.2 ソーシャル・バイラル施策 (Social Viral Loops)**
  - [ ] **[運用]** "Today's Score" Bot の運用開始（日替わりで名曲の譜例を投稿）
  - [ ] **[実装]** YouTube Shorts/TikTok 用の楽曲解説動画生成フローの検討

- [ ] **11.3 マネタイズ・ビジネス (Monetization & Business)**
  - [ ] **[実装]** 収益パスの最適化
    - [ ] アフィリエイトリンク (Score/Audio) のコンテキスト配置の精緻化
    - [ ] 楽曲ページへのApple Music / Spotify 埋め込みオートメーション
  - [ ] **[実装]** KPIモニタリングダッシュボード (Vercel Analytics / GSC) の構築

## Backlog / Issues (Future Improvements)

- [ ] **Score "Now Playing" Indicator**
  - 楽譜をクリックしてMini Playerを再生した際、クリックした楽譜に「再生中」という状態表示（ボーダーやアイコン変化など）を追加する。

- [ ] **ABC Notation Quality Improvement (MusicXML)**
  - 信頼できる MusicXML リポジトリ（MuseScore, IMSLP等）から ABC記法 への自動変換パイプラインを構築し、手動入力の手間を削減しつつ正確性を担保する。

- [ ] **Automated YouTube Curation Logic**
  - サイトのコンセプト（構造分析に適した演奏、音質、没入感）に合致する動画の選定基準を策定し、YouTube Data API を用いて候補を自動収集・フィルタリングする仕組みを構築する。

- [ ] **Accessibility (A11y) Audit for Score & Player**
  - 視覚障害者ユーザー（Screen Reader利用）が、「楽曲の構造」や「現在再生位置」を把握できるか、WAI-ARIA 属性の適切性を検証・改善する。

- [ ] **Automated Highlight & Timestamp Extraction**
  - AIにより「楽曲の聴きどころ（Highlight）」とYouTube音源の対応するタイムスタンプを自動抽出し、コンテンツ制作（ドラフト）の効率を飛躍的に高める。

- [ ] **Enhanced Search Scope (Composer, Era, etc.)**
  - 現在の検索機能はタイトルとタグのみを対象としている。UXと発見可能性を向上させるため、作曲家名、時代、楽器などのメタデータフィールドも検索対象に含めるようにリポジトリ層 (`FsContentRepository`) を改修する。

- [ ] **Faceted Search Implementation (Chip Counts)**
  - 未選択のフィルタ（難易度など）に対して、現在の絞り込み条件下でのヒット件数をリアルタイムに表示する機能（例：「中級 (4)」）。
  - これを実現するために、バックエンド（Supabase）側で Faceted Search（多面検索・集計）の仕組みを実装する。

- [ ] **Article Card Visualizer (List View)**
  - 一覧画面のカードで試聴を開始した際、再生中のカードにのみ控えめな波形アニメーション（Spectrum）を表示し、視覚的なフィードバックとプレミアムな質感を向上させる。
