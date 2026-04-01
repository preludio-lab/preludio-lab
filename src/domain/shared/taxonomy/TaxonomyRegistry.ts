import { AppLocale } from '@/domain/i18n/locale';
import { TaxonomyItem, TaxonomyCategory } from './types';

/**
 * タクソノミーデータへのアクセスを提供するドメインサービス。
 * インフラ層から提供されたデータを保持し、各ドメインモデルからの問い合わせに応答します。
 */
export class TaxonomyRegistry {
  private static instance: TaxonomyRegistry;
  private data: Record<string, unknown> = {};

  private constructor() {}

  public static getInstance(): TaxonomyRegistry {
    if (!TaxonomyRegistry.instance) {
      TaxonomyRegistry.instance = new TaxonomyRegistry();
    }
    return TaxonomyRegistry.instance;
  }

  /**
   * データを外部（インフラ層およびプロバイダー）から注入し、シングルトンインスタンスを初期化します。
   */
  public initialize(data: Record<string, unknown>) {
    this.data = data;
  }

  /**
   * 指定されたコレクションとIDに対応する項目を取得します。
   */
  public getItem(collectionKey: string, id: string | number): TaxonomyItem | undefined {
    const items = this.data[collectionKey] as (TaxonomyItem | TaxonomyCategory)[] | undefined;
    if (!items || !Array.isArray(items)) return undefined;

    for (const item of items) {
      if ('items' in item) {
        const subItem = item.items.find((i: TaxonomyItem) => i.id === id);
        if (subItem) return subItem;
      } else if ('id' in item && item.id === id) {
        return item;
      }
    }
    return undefined;
  }

  /**
   * 指定されたコレクションとIDに対応するラベルを取得します。
   */
  public getLabel(collectionKey: string, id: string | number, locale: AppLocale): string {
    const item = this.getItem(collectionKey, id);
    if (!item) return id.toString();

    const label = item.label;
    if (typeof label === 'string') return label;
    return label[locale] || label['en'] || label['ja'] || id.toString();
  }

  /**
   * 指定されたコレクションの全項目を取得します。
   */
  public getCollection(collectionKey: string): (TaxonomyItem | TaxonomyCategory)[] {
    return (this.data[collectionKey] as (TaxonomyItem | TaxonomyCategory)[]) || [];
  }
}

/**
 * タクソノミーレジストリのショートカット
 */
export const taxonomy = TaxonomyRegistry.getInstance();
