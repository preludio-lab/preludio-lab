import 'dotenv/config';
import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { eq } from 'drizzle-orm';
import { consola } from 'consola';
import * as schema from '../../src/infrastructure/database/schema/index.js';
import { TitleComponents, SupportedLang } from '../../src/domain/work/work.shared.js';
import { WorkTitleFormatter } from '../../src/domain/work/work.formatter.js';

/**
 * 既存のタイトル表示文字列からセマンティックな事実（Fact）を抽出し、
 * 新しい title_components, full_title カラムを埋める移行スクリプト。
 */

async function migrate() {
  consola.info('Starting title migration to semantic model...');

  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = drizzle(client, { schema: schema as any });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allWorks = await (db.query as any).works.findMany({
    with: {
      translations: true,
    },
  });

  consola.info(`Found ${allWorks.length} works to migrate.`);

  for (const work of allWorks) {
    try {
      consola.start(`Processing work: ${work.slug}`);

      // 既存の ja 翻訳をベースにヒューリスティックに抽出
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const jaTrans = work.translations.find((t: any) => t.lang === 'ja');

      if (!jaTrans) {
        consola.warn(`No Japanese translation for work: ${work.slug}. Skipping.`);
        continue;
      }

      // TitleComponents の初期化
      const tc: TitleComponents = {
        displayType: 'standard',
        number: undefined,
        distinctiveTitle: {},
        nickname: {},
        // 既存データを非推奨フィールドとして保持
        prefix: {},
        content: {},
      };

      // 全言語の既存データをマッピング
      for (const t of work.translations) {
        const lang = t.lang as SupportedLang;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (t.titlePrefix) (tc.prefix as any)[lang] = t.titlePrefix;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (t.titleContent) (tc.content as any)[lang] = t.titleContent;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (t.titleNickname) (tc.nickname as any)[lang] = t.titleNickname;
      }

      // 番号の抽出 (例: "交響曲第5番" -> 5)
      const prefixJa = jaTrans.titlePrefix || '';
      const numMatch = prefixJa.match(/第(\d+)番/);
      if (numMatch) {
        tc.number = parseInt(numMatch[1], 10);
      }

      // 固有タイトルの特定
      tc.distinctiveTitle = tc.content;

      // 2. 多言語タイトルの自動合成 (full_title の生成)
      const fullTitle: Record<string, string> = {};
      const langs: SupportedLang[] = ['ja', 'en', 'de', 'fr', 'it', 'es', 'zh'];

      for (const lang of langs) {
        fullTitle[lang] = WorkTitleFormatter.format(tc, {
          lang,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          catalogues: work.catalogues as any,
        });
      }

      // 3. 検索用テキストの生成
      const searchText = Object.values(fullTitle).join(' ');

      // 4. DB更新
      await db
        .update(schema.works)
        .set({
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          titleComponents: tc as any,
          fullTitle,
          searchText,
        })
        .where(eq(schema.works.id, work.id));

      consola.success(`Migrated work: ${work.slug}`);
    } catch (error) {
      consola.error(
        `Failed to migrate work: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  consola.info('Title migration completed.');
  process.exit(0);
}

migrate().catch((err) => {
  consola.error(err);
  process.exit(1);
});
