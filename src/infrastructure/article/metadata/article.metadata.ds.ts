import { ArticleCategory } from '@/domain/article/article.metadata';
import { ArticleStatus, ArticleMasterId } from '@/domain/article/article.control';
import { ArticleSearchCriteria } from '@/domain/article/article.repository';

/**
 * 記事マスター行 (Article Master Row)
 *
 * 全言語共通のマスターメタデータを保持するデータ構造を定義します。
 * 特定のデータベース（Turso/SQLite）やファイルシステムの構造に依存せず、
 * 永続化層における記事の「基底情報」としての共有インターフェースを提供します。
 */
export interface ArticleMasterRow {
  /** マスターUUID (全言語版で不変の識別子) */
  id: string;
  /** 関連する楽曲ID (オプション) */
  workId: string | null;
  /** マスター用スラッグ */
  slug: string;
  /** 記事カテゴリ (楽曲解説、理論など) */
  category: ArticleCategory;
  /** おすすめ記事フラグ */
  isFeatured: boolean;
  /** 推定読了時間（秒） */
  readingTimeSeconds: number;
  /** サムネイル画像パス */
  thumbnailPath: string | null;
  /** 作成日時 (ISO 8601 形式) */
  createdAt: string;
  /** 更新日時 (ISO 8601 形式) */
  updatedAt: string;
}

/**
 * 記事翻訳行 (Article Row / Translation Row)
 *
 * 特定の言語版（翻訳版）に固有のメタデータとコンテンツ属性を保持するデータ構造を定義します。
 * ドメイン層の Article/ArticleSummary エンティティを再構築するための
 * ローカライズされたプロパティ集合を表現します。
 */
export interface ArticleRow {
  /** 翻訳版固有のUUID (各言語版ごとに一意) */
  id: string;
  /** 親となるマスターUUID */
  articleId: string;
  /** 言語コード (en, ja など) */
  lang: string;
  /** 公開ステータス */
  status: ArticleStatus;
  /** 記事タイトル */
  title: string;
  /** 表示用タイトル (タイトルと異なる場合に使用) */
  displayTitle: string;
  /** キャッチコピー */
  catchcopy: string | null;
  /** 抜粋文 / 概要 */
  excerpt: string | null;
  /** 公開日時 (ISO 8601 形式) */
  publishedAt: string | null;
  /** 翻訳版におけるおすすめフラグ */
  isFeatured: boolean;
  /** コンテンツファイルの保存パス（物理層がファイル管理を行う場合に使用） */
  mdxPath?: string | null;
  /** 言語固有のスラッグ (URLの局所化に使用) */
  slSlug: string;
  /** 言語固有のカテゴリ表示名 */
  slCategory: ArticleCategory;
  /** 作曲家名 (ローカライズ版) */
  slComposerName: string | null;
  /** 作品目録ID */
  slWorkCatalogueId: string | null;
  /** 作品通称リスト */
  slWorkNicknames: string[] | null;
  /** ジャンルリスト */
  slGenre: string[] | null;
  /** 編成リスト */
  slInstrumentations: string[] | null;
  /** 時代背景 */
  slEra: string | null;
  /** 国籍 */
  slNationality: string | null;
  /** 調性 */
  slKey: string | null;
  /** 演奏難易度 (1-5) */
  slPerformanceDifficulty: number | null;
  /** 印象評価などの多次元データ */
  slImpressionDimensions: unknown;
  /** 所属シリーズ情報 */
  slSeriesAssignments: unknown;
  /** 追加の非構造化メタデータ（JSONカラム等に対応） */
  metadata: unknown;
  /** コンテンツ（MDX）の目次構造 */
  contentStructure: unknown;
  /** 翻訳レコードの作成日時 */
  createdAt: string;
  /** 翻訳レコードの最終更新日時 */
  updatedAt: string;
}

/**
 * 記事メタデータ行のセット
 *
 * 永続化層から取得、または保存する際の「マスター情報」と「言語固有情報」の
 * 統合されたデータペアを定義します。
 */
export interface ArticleMetadataRow {
  /** 共通マスター情報 */
  articles: ArticleMasterRow;
  /** 指定された言語の翻訳情報 */
  article_translations: ArticleRow;
}

/**
 * 記事メタデータ・データソース・インターフェース
 *
 * 記事のメタデータ（集約サマリー）に対する永続化・検索操作を抽象化します。
 * このインターフェースを実装することで、Turso (SQL)、File System (MDX/JSON)、
 * または外部APIなど、異なるバックエンドを透過的に切り替えることが可能になります。
 */
export interface IArticleMetadataDataSource {
  /**
   * マスターIDと言語コードを指定して記事のメタデータを取得します。
   *
   * @param id - Article Master ID
   * @param lang - 言語コード (AppLocale)
   * @returns 取得されたメタデータ行、見つからない場合は undefined
   */
  findById(id: ArticleMasterId, lang: string): Promise<ArticleMetadataRow | undefined>;

  /**
   * スラッグと言語コードを指定して記事のメタデータを取得します。
   * カテゴリによる絞り込みも可能です。
   *
   * @param slug - 検索対象のスラッグ
   * @param lang - 言語コード
   * @param category - (オプション) カテゴリ
   * @returns 取得されたメタデータ行、見つからない場合は undefined
   */
  findBySlug(
    slug: string,
    lang: string,
    category?: ArticleCategory,
  ): Promise<ArticleMetadataRow | undefined>;

  /**
   * 指定された検索条件（フィルタ、ソート、ページネーション）に基づいて記事メタデータの一覧を取得します。
   *
   * @param criteria - 検索クエリ条件
   * @returns ページングされた結果セットと総件数
   */
  search(criteria: ArticleSearchCriteria): Promise<{
    rows: ArticleMetadataRow[];
    totalCount: number;
  }>;

  /**
   * メタデータ（マスターおよび翻訳レコード）を保存または更新します。
   *
   * @param row - 保存対象のメタデータセット
   */
  save(row: ArticleMetadataRow): Promise<void>;

  /**
   * 特定の言語の翻訳レコードを削除します。
   *
   * @param id - Article Master ID
   * @param lang - 言語コード
   */
  deleteTranslation(id: ArticleMasterId, lang: string): Promise<void>;

  /**
   * 指定されたマスターIDに紐づく有効な翻訳レコードの総数を取得します。
   * (全言語の削除判定などに使用)
   *
   * @param id - Article Master ID
   */
  countTranslations(id: ArticleMasterId): Promise<number>;

  /**
   * 指定されたマスターIDに紐づく全ての言語の翻訳情報を取得します。
   *
   * @param id - Article Master ID
   */
  findAllTranslations(id: ArticleMasterId): Promise<ArticleMetadataRow[]>;

  /**
   * 指定された ID のマスターレコードおよび、紐づく全ての翻訳レコードを物理削除します。
   *
   * @param id - Article Master ID
   */
  deleteAll(id: ArticleMasterId): Promise<void>;
}
