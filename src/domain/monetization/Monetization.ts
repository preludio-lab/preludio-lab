import { z } from 'zod';
import { createMultilingualStringSchema } from '../i18n/Locale';
import { UrlSchema } from '../shared/CommonMetadata';

/**
 * Monetization Type
 * 収益化要素の種別
 */
export const MonetizationType = {
  /** 第三者提携 (Amazon, CDショップ等への紹介手数料モデル) */
  AFFILIATE: 'affiliate',
  /** 自社ブランド商品 (オリジナル楽譜、分析資料、グッズ等。販売基盤は問わない) */
  STORE: 'store',
  /** 支援・寄付 (投げ銭、Ko-fi、Buy Me a Coffee 等) */
  SUPPORT: 'support',
  /** 会員購読・継続課金 (プレミアムプランへの誘導) */
  SUBSCRIPTION: 'subscription',
  /** その他 */
  OTHER: 'other',
} as const;

export type MonetizationType = (typeof MonetizationType)[keyof typeof MonetizationType];

/**
 * Monetization Category
 * 商材・対象物のカテゴリ
 */
export const MonetizationCategory = {
  /** 楽譜 (物理本・輸入譜等) */
  SCORE_PHYSICAL: 'score_physical',
  /** 楽譜 (PDF・電子楽譜等) */
  SCORE_DIGITAL: 'score_digital',
  /** 音源・映像 (CD・DVD・LP等) */
  RECORDING_PHYSICAL: 'recording_physical',
  /** 音源・映像 (配信・ダウンロード等) */
  RECORDING_DIGITAL: 'recording_digital',
  /** 書籍 (伝記、音楽理論書、専門書等) */
  BOOK: 'book',
  /** 教育・講座 (動画レッスン、ワークショップ等) */
  COURSE: 'course',
  /** 楽器・備品 (楽器本体、弦、リード、アクセサリー等) */
  EQUIPMENT: 'equipment',
  /** その他 (ドネーション、会員権等) */
  OTHER: 'other',
} as const;

export type MonetizationCategory = (typeof MonetizationCategory)[keyof typeof MonetizationCategory];

/**
 * Monetization Provider
 * 収益化要素の提供元プラットフォーム
 */
export const MonetizationProvider = {
  /** Amazon (CD, 楽譜, 書籍等) */
  AMAZON: 'amazon',
  /** Apple Music / iTunes (配信, 楽曲購入) */
  APPLE_MUSIC: 'apple_music',
  /** Spotify (配信) */
  SPOTIFY: 'spotify',
  /** Presto Music (英・クラシック音楽専門ストア) */
  PRESTO_MUSIC: 'presto_music',
  /** Sheet Music Plus (米・世界最大級の楽譜サイト) */
  SHEET_MUSIC_PLUS: 'sheet_music_plus',
  /** ぷりんと楽譜 (ヤマハ・国内最大級の楽譜配信) */
  YAMAHA_PRINTO: 'yamaha_printo',
  /** Henle Library (独・ヘンレ社デジタル/物理楽譜) */
  HENLE: 'henle',
  /** Ko-fi (クリエイター支援プラットフォーム) */
  KO_FI: 'ko_fi',
} as const;

export type MonetizationProvider = (typeof MonetizationProvider)[keyof typeof MonetizationProvider];

/**
 * Monetization Action
 * UIでの表示アクション
 */
export const MonetizationAction = {
  /** 購入 */
  BUY: 'buy',
  /** 詳細を見る */
  VIEW: 'view',
  /** 試聴・視聴 */
  LISTEN: 'listen',
  /** 支援・ドネーション */
  SUPPORT: 'support',
  /** ダウンロード */
  DOWNLOAD: 'download',
  /** その他 */
  OTHER: 'other',
} as const;

export type MonetizationAction = (typeof MonetizationAction)[keyof typeof MonetizationAction];

/**
 * 収益化要素（アフィリエイト、自社商品等）の定義
 * 用語集: Monetization Element
 */
export const MonetizationElementSchema = z.object({
  /** 収益化要素の種別 (affiliate, store, support 等) */
  type: z.nativeEnum(MonetizationType),
  /** 商材カテゴリ (score, recording, book 等) */
  category: z.nativeEnum(MonetizationCategory),
  /**
   * 対象となる商品・サービス名 (多言語)
   * 例: "交響曲第5番 楽譜 (ヘンレ版)", "月刊プレミアムプラン"
   */
  title: createMultilingualStringSchema({ max: 50 }),
  /** リンク先URL */
  url: UrlSchema,
  /**
   * 提供元プラットフォーム (UIでのアイコン表示や識別に利用)
   */
  provider: z.nativeEnum(MonetizationProvider).optional(),
  /**
   * UIでの表示アクション (i18n対応済みラベルとの紐付けに使用)
   */
  action: z.nativeEnum(MonetizationAction),
  /**
   * カスタム表示ラベル (多言語, 指定がある場合は action の標準文言より優先)
   */
  customLabel: createMultilingualStringSchema({ max: 20 }).optional(),
  /**
   * 価格の目安 (UI表示用の文字列)
   * 例: "¥3,500", "$5.00 / mo"
   */
  priceHint: z.string().max(20).optional(),
});

export type MonetizationElement = z.infer<typeof MonetizationElementSchema>;
