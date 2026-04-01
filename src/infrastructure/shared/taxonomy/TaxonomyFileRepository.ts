import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';
import { TaxonomyFileSchema, TaxonomyItem, TaxonomyCategory } from '@/domain/shared/taxonomy/types';
import { AppLocale } from '@/domain/i18n/locale';

/**
 * YAMLファイルからタクソノミーデータを読み込むリポジトリ。
 * サーバーサイド環境 (Node.js) でのみ動作します。
 */
export class TaxonomyFileRepository {
  private static instance: TaxonomyFileRepository;
  private cache: Map<string, unknown> = new Map();
  private readonly taxonomyDir: string;

  private constructor() {
    this.taxonomyDir = join(process.cwd(), 'src/domain/shared/taxonomy');
  }

  public static getInstance(): TaxonomyFileRepository {
    if (!TaxonomyFileRepository.instance) {
      TaxonomyFileRepository.instance = new TaxonomyFileRepository();
    }
    return TaxonomyFileRepository.instance;
  }

  /**
   * 全てのタクソノミーファイルを読み込み、正規化されたデータとして返します。
   */
  public async getAllTaxonomy(): Promise<Record<string, unknown>> {
    if (this.cache.has('all')) {
      return this.cache.get('all') as Record<string, unknown>;
    }

    const files = readdirSync(this.taxonomyDir).filter((f) => f.endsWith('.yaml'));
    const allData: Record<string, unknown> = {};

    for (const file of files) {
      const filePath = join(this.taxonomyDir, file);
      const content = readFileSync(filePath, 'utf8');
      const data = parse(content);

      // バリデーション (オプションだが安全のため)
      const result = TaxonomyFileSchema.safeParse(data);
      if (!result.success) {
        // バリデーション失敗時はスキップ
        continue;
      }

      // ファイルのトップレベルキーを結合
      Object.assign(allData, data);
    }

    this.cache.set('all', allData);
    return allData;
  }

  /**
   * 特定の項目IDに対応するラベルを、指定された言語またはフォールバックで取得します。
   */
  public async getLabel(
    collectionKey: string,
    id: string | number,
    locale: AppLocale,
  ): Promise<string> {
    const data = await this.getAllTaxonomy();
    const items = data[collectionKey] as (TaxonomyItem | TaxonomyCategory)[];

    if (!items) return id.toString();

    // フラットなアイテムリストを検索
    for (const item of items) {
      // items (カテゴリ構造) を持つ場合
      if ('items' in item) {
        const subItem = item.items.find((i: TaxonomyItem) => i.id === id);
        if (subItem) {
          return this.localizeLabel(subItem.label, locale) || id.toString();
        }
      } else if ('id' in item && item.id === id) {
        // 直接アイテムの場合
        return this.localizeLabel(item.label, locale) || id.toString();
      }
    }

    return id.toString();
  }

  private localizeLabel(label: unknown, locale: AppLocale): string | undefined {
    if (typeof label === 'string') return label;
    if (typeof label === 'object' && label !== null) {
      const l = label as Record<string, string>;
      return l[locale] || l['en'] || l['ja'];
    }
    return undefined;
  }
}
