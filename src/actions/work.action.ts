'use server';

import { z } from 'zod';
import { ActionResponse } from './shared/action-response';
import { UpdateWorkDetailCommandSchema } from '@/application/work/command/update-work-detail.command';
import { WorkRepositoryImpl } from '@/infrastructure/work/work.repository';
import { TursoWorkDataSource } from '@/infrastructure/work/turso.work.ds';
import { TursoComposerDataSource } from '@/infrastructure/composer/turso.composer.ds';
import { TursoComposerSearchQueryService } from '@/infrastructure/composer/turso.composer-search.query.service';
import { db } from '@/infrastructure/database/turso.client';
import { TursoTransactionManager } from '@/infrastructure/database/turso.transaction-manager';
import { AppError } from '@/domain/shared/app-error';
import { serverLogger as logger } from '@/infrastructure/logging/server.logger';
import { revalidatePath } from 'next/cache';
import type { ComposerSearchResult } from '@/application/composer/query/composer-search-query.interface';
import type { WorkRows } from '@/infrastructure/work/interfaces/work.ds.interface';

/**
 * updateWorkAction
 * 作品詳細の更新 Server Action。
 * Zodバリデーション -> UseCase -> revalidatePath のフローを実行。
 */
export async function updateWorkAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResponse<void>> {
  try {
    // 1. Payload extraction & validation
    const rawDataJson = formData.get('data') as string;
    if (!rawDataJson) {
      return {
        success: false,
        errorType: 'VALIDATION_ERROR',
        errors: {},
        message: 'No data provided',
      };
    }

    const rawData = JSON.parse(rawDataJson);
    const parsed = UpdateWorkDetailCommandSchema.safeParse(rawData);

    if (!parsed.success) {
      return {
        success: false,
        errorType: 'VALIDATION_ERROR',
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
        message: 'Validation failed',
      };
    }

    const command = parsed.data;

    // 2. DI Setup
    const workDS = new TursoWorkDataSource(db);
    const composerDS = new TursoComposerDataSource(db);
    const repository = new WorkRepositoryImpl(workDS, composerDS);
    const txManager = new TursoTransactionManager(db);

    // 3. Optimistic Locking Check
    const existingWork = await repository.findById(command.id);
    if (!existingWork) {
      return { success: false, errorType: 'NOT_FOUND', message: 'Work not found' };
    }

    const dbUpdatedAt = existingWork.control.updatedAt.toISOString();
    if (dbUpdatedAt !== command.updatedAt) {
      return {
        success: false,
        errorType: 'CONCURRENCY_ERROR',
        message: 'This record has been modified by another user. Please reload and try again.',
      };
    }

    // 4. WorkPart deletion constraint check
    const existingRows = await workDS.findById(command.id);
    const existingPartIds = (existingRows?.parts ?? []).map((p) => p.part.id);
    const incomingPartIds = new Set(command.parts.map((p) => p.id));
    const _deletedPartIds = existingPartIds.filter((id) => !incomingPartIds.has(id));

    // TODO: When phrases/recordings are implemented, check references here
    // For now, we just proceed with the deletion (no references exist yet)
    // Future: const referencedParts = await checkPartReferences(deletedPartIds);
    // if (referencedParts.length > 0) return CONSTRAINT_ERROR

    // 5. Save via DataSource transaction (full replace)
    const { generateId } = await import('@/shared/id');

    await txManager.run(async (ctx) => {
      // Build Work row
      const workRow = {
        id: command.id,
        composerId: command.composerId,
        slug: command.slug,
        catalogues: command.catalogues,
        era: command.era ?? null,
        instrumentation: command.instrumentation ?? null,
        instrumentationFlags:
          command.instrumentationFlags ?? existingRows!.work.instrumentationFlags,
        performanceDifficulty: command.performanceDifficulty ?? null,
        keyTonality: command.keyTonality ?? null,
        tempoText: command.tempoText ?? null,
        tsNumerator: existingRows!.work.tsNumerator,
        tsDenominator: existingRows!.work.tsDenominator,
        tsDisplayString: existingRows!.work.tsDisplayString,
        bpm: existingRows!.work.bpm,
        metronomeUnit: existingRows!.work.metronomeUnit,
        impressionDimensions:
          command.impressionDimensions ?? existingRows!.work.impressionDimensions,
        genres: command.genres,
        tags: command.tags,
        instruments: command.instruments,
        compositionYear: command.compositionYear ?? null,
        compositionPeriod: existingRows!.work.compositionPeriod,
        basedOn: existingRows!.work.basedOn,
        createdAt: existingRows!.work.createdAt,
        updatedAt: new Date().toISOString(),
      };

      // Build Work Translation rows
      const workTranslations = Object.entries(command.translations).map(([lang, t]) => ({
        id: generateId(),
        workId: command.id,
        lang,
        title: t.title,
        titlePrefix: t.titlePrefix ?? null,
        titleContent: t.titleContent ?? null,
        titleNickname: t.titleNickname ?? null,
        nicknames: [] as string[],
        compositionPeriod: null,
        description: t.description ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      // Build Part rows
      const partRows = command.parts.map((p) => ({
        part: {
          id: p.id,
          workId: command.id,
          slug: p.slug,
          catalogues: [],
          type: p.type,
          isNameStandard: p.isNameStandard,
          sortOrder: p.sortOrder,
          performanceDifficulty: p.performanceDifficulty ?? null,
          keyTonality: p.keyTonality ?? null,
          tempoText: p.tempoText ?? null,
          tsNumerator: null,
          tsDenominator: null,
          tsDisplayString: null,
          bpm: null,
          metronomeUnit: null,
          impressionDimensions: p.impressionDimensions ?? null,
          genres: p.genres,
          instruments: p.instruments,
          nicknames: [] as string[],
          basedOn: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        translations: Object.entries(p.translations).map(([lang, t]) => ({
          id: generateId(),
          workPartId: p.id,
          lang,
          title: t.title,
          titlePrefix: t.titlePrefix ?? null,
          titleContent: t.titleContent ?? null,
          titleNickname: t.titleNickname ?? null,
          tempoTranslation: t.tempoTranslation ?? null,
          description: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        })),
      }));

      // Cast via unknown to WorkRows to satisfy strict linter checks without explicit any
      await workDS.save(
        { work: workRow, translations: workTranslations, parts: partRows } as unknown as WorkRows,
        ctx,
      );
    });

    // 6. Revalidate
    revalidatePath(`/[lang]/admin/works/${command.id}`, 'page');

    logger.info('Updated Work', { id: command.id });
    return { success: true, data: undefined };
  } catch (error) {
    if (error instanceof AppError) {
      if (error.code === 'CONCURRENCY_ERROR') {
        return { success: false, errorType: 'CONCURRENCY_ERROR', message: error.message };
      }
      if (error.code === 'NOT_FOUND') {
        return { success: false, errorType: 'NOT_FOUND', message: error.message };
      }
    }

    logger.error('updateWorkAction failed', error as Error);
    return {
      success: false,
      errorType: 'SYSTEM_ERROR',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}

/**
 * searchComposersAction
 * Async Typeahead 用の作曲家検索 Server Action。
 */
const SearchComposerSchema = z.object({
  query: z.string().min(1).max(100),
  lang: z.string().default('ja'),
});

export async function searchComposersAction(
  input: z.infer<typeof SearchComposerSchema>,
): Promise<ActionResponse<ComposerSearchResult[]>> {
  try {
    const parsed = SearchComposerSchema.safeParse(input);
    if (!parsed.success) {
      return {
        success: false,
        errorType: 'VALIDATION_ERROR',
        errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
        message: 'Invalid search query',
      };
    }

    const queryService = new TursoComposerSearchQueryService(db);
    const results = await queryService.searchByName(parsed.data.query, parsed.data.lang);

    return { success: true, data: results };
  } catch (error) {
    logger.error('searchComposersAction failed', error as Error);
    return {
      success: false,
      errorType: 'SYSTEM_ERROR',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}
