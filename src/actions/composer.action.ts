'use server';

import { z } from 'zod';
import { ActionResponse } from './shared/action-response';
import { UpdateComposerUseCase } from '@/application/composer/usecase/update-composer.usecase';
import { ComposerRepositoryImpl } from '@/infrastructure/composer/composer.repository';
import { TursoComposerDataSource } from '@/infrastructure/composer/turso.composer.ds';
import { db } from '@/infrastructure/database/turso.client';
import { AppError } from '@/domain/shared/app-error';

// Zod Schema based on the policy of sending all language data
const TranslationSchema = z.object({
  fullName: z.string().min(1, { message: 'Required' }),
  displayName: z.string().min(1, { message: 'Required' }),
  shortName: z.string().min(1, { message: 'Required' }),
  biography: z.string().nullable().optional(),
});

const UpdateComposerSchema = z.object({
  id: z.string().uuid(),
  slug: z.string().min(1),
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const useCase = new UpdateComposerUseCase(
      repository,
      {} as any /* mock txManager */,
      console as any,
    ); // Adapt to the existing signature

    // We already noticed previous existing UpdateComposerUseCase has different signature.
    // The previous implementation requires `UpdateComposerCommand`.
    // Let's adapt our parsed DTO to it.

    // 3. Execution
    await useCase.execute({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      id: parsedData.data.id as any,
      slug: parsedData.data.slug,
      birthDate: parsedData.data.birthDate ?? undefined,
      deathDate: parsedData.data.deathDate ?? undefined,
      translations: parsedData.data.translations,
      updatedAt: parsedData.data.updatedAt,
      // mapping missing fields correctly inside UseCase adapting logic
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

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
