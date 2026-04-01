import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';
import { z } from 'zod';
import consola from 'consola';

// 言語定義
const Locales = z.enum(['ja', 'en', 'de', 'fr', 'it', 'es', 'zh']);

// ラベルスキーマ（7言語必須、または共通の文字列）
const LabelSchema = z.union([z.record(Locales, z.string().min(1)), z.string().min(1)]);

// 解説文スキーマ（JA/EN必須、他は任意）
const DescriptionSchema = z.object({
  ja: z.string().min(1),
  en: z.string().min(1),
  de: z.string().optional(),
  fr: z.string().optional(),
  it: z.string().optional(),
  es: z.string().optional(),
  zh: z.string().optional(),
});

// 基本的なタクソノミーアイテムのスキーマ
const BaseItemSchema = z.object({
  id: z.union([z.string().min(1), z.number()]),
  label: LabelSchema,
  description: DescriptionSchema.optional(),
});

// カテゴリ構造を持つ場合のスキーマ（ジャンル、楽器、タグ等）
const CategorySchema = z.object({
  category: z.string().optional(),
  label: LabelSchema.optional(),
  items: z.array(
    BaseItemSchema.extend({
      examples: z.array(z.string()).optional(),
    }),
  ),
});

// ファイルごとのトップレベルスキーマ
const TaxonomyFileSchema = z.record(
  z.string(),
  z.union([z.array(BaseItemSchema), z.array(CategorySchema)]),
);

const TAXONOMY_DIR = 'src/domain/shared/taxonomy';

function validateFile(filename: string) {
  const filePath = join(TAXONOMY_DIR, filename);
  const content = readFileSync(filePath, 'utf8');
  const data = parse(content);

  const result = TaxonomyFileSchema.safeParse(data);
  if (!result.success) {
    consola.error(`Validation failed for ${filename}:`);
    consola.error(result.error.format());
    process.exit(1);
  }

  // IDの重複チェック
  for (const key in data) {
    const ids = new Set<string | number>();
    const items = data[key];
    for (const item of items) {
      if ('id' in item) {
        if (ids.has(item.id)) {
          consola.error(`Duplicate ID found in ${filename}: ${item.id}`);
          process.exit(1);
        }
        ids.add(item.id);
      }
      if ('items' in item) {
        for (const subItem of item.items) {
          if (ids.has(subItem.id)) {
            consola.error(`Duplicate ID found in ${filename}: ${subItem.id}`);
            process.exit(1);
          }
          ids.add(subItem.id);
        }
      }
    }
  }

  consola.success(`Validated ${filename}`);
}

function main() {
  const files = readdirSync(TAXONOMY_DIR).filter((f) => f.endsWith('.yaml'));
  for (const file of files) {
    validateFile(file);
  }
}

main();
