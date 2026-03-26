import { eq } from 'drizzle-orm';
import { LibSQLDatabase } from 'drizzle-orm/libsql';
import * as schema from '@/infrastructure/database/schema';
import { IWorkDetailQueryService } from '@/application/work/query/work-detail-query.interface';
import type { WorkDetailDto, WorkPartDetailDto } from '@/application/work/dto/work-detail.dto';
import { SUPPORTED_LANGUAGES } from '@/application/work/dto/work-detail.dto';
import type { SupportedLanguage } from '@/application/work/dto/work-detail.dto';

/**
 * Turso Work Detail Query Service
 * IWorkDetailQueryService ポートの Turso 実装。
 * DB から直接 WorkDetailDto を構築し、インフラ詳細をアプリ層から完全に隠蔽します。
 */
export class TursoWorkDetailQueryService implements IWorkDetailQueryService {
  constructor(private readonly db: LibSQLDatabase<typeof schema>) {}

  async findById(workId: string): Promise<WorkDetailDto | null> {
    // 1. Work + Composer を取得
    const workResult = await this.db.query.works.findFirst({
      where: eq(schema.works.id, workId),
      with: {
        composer: {
          columns: {
            id: true,
            slug: true,
          },
          with: {
            translations: {
              columns: {
                lang: true,
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (!workResult) return null;

    // 2. Work Translations
    const workTranslations = await this.db.query.workTranslations.findMany({
      where: eq(schema.workTranslations.workId, workId),
    });

    // 3. Work Parts + Part Translations
    const parts = await this.db.query.workParts.findMany({
      where: eq(schema.workParts.workId, workId),
      with: {
        translations: true,
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      orderBy: (p: any, { asc }: any) => [asc(p.sortOrder)],
    });

    // 4. Composer name resolution (prefer ja, fallback to first)
    const composerTranslations = workResult.composer?.translations ?? [];
    const composerNameJa = composerTranslations.find((t) => t.lang === 'ja');
    const composerName =
      composerNameJa?.displayName ?? composerTranslations[0]?.displayName ?? 'Unknown';

    // 5. Build Work translations record
    const translationsRecord = {} as Record<
      SupportedLanguage,
      {
        title: string;
        titlePrefix: string | null;
        titleContent: string | null;
        titleNickname: string | null;
        description: string | null;
      }
    >;
    const supportedSet = new Set<string>(SUPPORTED_LANGUAGES);
    for (const t of workTranslations) {
      if (!supportedSet.has(t.lang)) continue;
      translationsRecord[t.lang as SupportedLanguage] = {
        title: t.title,
        titlePrefix: t.titlePrefix,
        titleContent: t.titleContent,
        titleNickname: t.titleNickname,
        description: t.description,
      };
    }

    // 6. Build Parts DTOs
    const partDtos: WorkPartDetailDto[] = parts.map((part) => {
      const partTransRecord = {} as Record<
        SupportedLanguage,
        {
          title: string;
          titlePrefix: string | null;
          titleContent: string | null;
          titleNickname: string | null;
          tempoTranslation: string | null;
        }
      >;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const t of (part as any).translations ?? []) {
        if (!supportedSet.has(t.lang)) continue;
        partTransRecord[t.lang as SupportedLanguage] = {
          title: t.title,
          titlePrefix: t.titlePrefix,
          titleContent: t.titleContent,
          titleNickname: t.titleNickname,
          tempoTranslation: t.tempoTranslation,
        };
      }

      return {
        id: part.id,
        slug: part.slug,
        sortOrder: part.sortOrder,
        type: part.type,
        isNameStandard: part.isNameStandard,
        catalogues: (part.catalogues ?? []).map((c) => ({
          prefix: c.prefix,
          number: c.number,
          sortOrder: c.sortOrder,
          isPrimary: c.isPrimary,
        })),
        keyTonality: part.keyTonality,
        tempoText: part.tempoText,
        genres: (part.genres as string[]) ?? [],
        instruments: (part.instruments as string[]) ?? [],
        performanceDifficulty: part.performanceDifficulty,
        translations: partTransRecord,
        createdAt: part.createdAt,
        updatedAt: part.updatedAt,
      } as WorkPartDetailDto;
    });

    // 7. Assemble DTO
    const work = workResult;
    return {
      id: work.id,
      composerId: work.composerId,
      composerSlug: workResult.composer?.slug ?? '',
      composerName,
      slug: work.slug,
      createdAt: work.createdAt,
      updatedAt: work.updatedAt,

      era: work.era,
      instrumentation: work.instrumentation,
      performanceDifficulty: work.performanceDifficulty,
      compositionYear: work.compositionYear,
      keyTonality: work.keyTonality,
      tempoText: work.tempoText,
      catalogues: (work.catalogues ?? []).map((c) => ({
        prefix: c.prefix,
        number: c.number,
        sortOrder: c.sortOrder,
        isPrimary: c.isPrimary,
      })),
      genres: (work.genres as string[]) ?? [],
      tags: (work.tags as string[]) ?? [],
      instruments: (work.instruments as string[]) ?? [],

      translations: translationsRecord,

      parts: partDtos,
    } as WorkDetailDto;
  }
}
