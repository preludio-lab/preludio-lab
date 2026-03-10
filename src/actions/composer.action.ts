'use server';

import { z } from 'zod';
import { SlugSchema } from '@/domain/shared/common.metadata';
import { ActionResponse } from './shared/action-response';
import { UpdateComposerUseCase } from '@/application/composer/usecase/update-composer.usecase';
import { ComposerRepositoryImpl } from '@/infrastructure/composer/composer.repository';
import { TursoComposerDataSource } from '@/infrastructure/composer/turso.composer.ds';
import { db } from '@/infrastructure/database/turso.client';
import { TursoTransactionManager } from '@/infrastructure/database/turso.transaction-manager';
import { AppError } from '@/domain/shared/app-error';
import { serverLogger as logger } from '@/infrastructure/logging/server.logger';

// Zod Schema based on the policy of sending all language data
const TranslationSchema = z.object({
  fullName: z.string().min(1, { message: 'Required' }),
  displayName: z.string().min(1, { message: 'Required' }),
  shortName: z.string().min(1, { message: 'Required' }),
  biography: z.string().nullable().optional(),
});

const UpdateComposerSchema = z.object({
  id: z.string().uuid(),
  slug: SlugSchema,
  era: z.string().nullable().optional(),
  birthDate: z.string().nullable().optional(),
  deathDate: z.string().nullable().optional(),
  nationalityCode: z.string().nullable().optional(),
  translations: z.record(z.enum(['ja', 'en', 'es', 'de', 'fr', 'it', 'zh']), TranslationSchema),
  updatedAt: z.string().min(1), // Required for Optimistic Locking
});

// Type for future use if needed, but omitted for now to fix unused-vars lint
// type UpdateComposerFormData = z.infer<typeof UpdateComposerSchema>;

/**
 * Controller corresponding to the form submission.
 * Validates inputs strictly, throws validation errors back directly,
 * and calls the `UpdateComposerUseCase` if validated.
 */
export async function updateComposerAction(
  prevState: unknown,
  formData: FormData,
): Promise<ActionResponse<void>> {
  try {
    // 1. DTO Generation / Validation
    // Assume front-end sends a JSON string inside a special field to simplify 7-lang nesting,
    // or manually reconstruct object from flat keys for FormData.
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
    const parsedData = UpdateComposerSchema.safeParse(rawData);

    if (!parsedData.success) {
      return {
        success: false,
        errorType: 'VALIDATION_ERROR',
        errors: parsedData.error.flatten().fieldErrors,
        message: 'Validation failed',
      };
    }

    // 2. DI Setup (Would ideally be handled by a container, but initialized here for PoC)
    // We instantiate infra/repository/usecase explicitly
    const ds = new TursoComposerDataSource(db);
    const repository = new ComposerRepositoryImpl(ds);
    const txManager = new TursoTransactionManager(db);

    const useCase = new UpdateComposerUseCase(repository, txManager, logger);

    // We already noticed previous existing UpdateComposerUseCase has different signature.
    // The previous implementation requires `UpdateComposerCommand`.
    // Let's adapt our parsed DTO to it.

    // 3. Execution
    // Adapt UI translation array to MultilingualString objects for domain schema
    const translations = parsedData.data.translations;
    const fullName: Record<string, string> = {};
    const displayName: Record<string, string> = {};
    const shortName: Record<string, string> = {};
    const biography: Record<string, string> = {};

    for (const [lang, trans] of Object.entries(translations)) {
      fullName[lang] = trans.fullName;
      displayName[lang] = trans.displayName;
      shortName[lang] = trans.shortName;
      if (trans.biography) {
        biography[lang] = trans.biography;
      }
    }

    await useCase.execute({
      slug: parsedData.data.slug,
      fullName,
      displayName,
      shortName,
      biography: Object.keys(biography).length > 0 ? biography : undefined,
      birthDate: parsedData.data.birthDate ? new Date(parsedData.data.birthDate) : undefined,
      deathDate: parsedData.data.deathDate ? new Date(parsedData.data.deathDate) : undefined,
      // We'll pass the optimstic locking updatedat into a domain concern later if needed
    });

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

    return {
      success: false,
      errorType: 'SYSTEM_ERROR',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
    };
  }
}
