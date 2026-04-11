'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { SavePhraseUseCase } from '@/application/score/usecase/save-phrase.usecase';
import { DeletePhraseUseCase } from '@/application/score/usecase/get-phrases.usecase';
import { PhraseRepositoryImpl } from '@/infrastructure/score/phrase.repository';
import { TursoPhraseDataSource } from '@/infrastructure/score/turso.phrase.ds';
import { TursoWorkDataSource } from '@/infrastructure/work/turso.work.ds';
import { TursoComposerDataSource } from '@/infrastructure/composer/turso.composer.ds';
import { TursoScoreDataSource } from '@/infrastructure/score/turso.score.ds';
import { db } from '@/infrastructure/database/turso.client';
import { PhraseId, createPhrase } from '@/domain/score/phrase';
import { generateId } from '@/shared/id';
import { AppError } from '@/domain/shared/app-error';
import { PhraseMetadataSchema } from '@/domain/score/phrase.metadata';
import { z } from 'zod';
import { consola } from 'consola';

type PhraseFormValues = z.infer<typeof PhraseMetadataSchema>;

// DI Setup
const phraseDataSource = new TursoPhraseDataSource(db);
const workDataSource = new TursoWorkDataSource(db);
const composerDataSource = new TursoComposerDataSource(db);
const scoreDataSource = new TursoScoreDataSource(db);

const repository = new PhraseRepositoryImpl(
  phraseDataSource,
  workDataSource,
  composerDataSource,
  scoreDataSource,
);

const saveUseCase = new SavePhraseUseCase(repository);
const deleteUseCase = new DeletePhraseUseCase(repository);

/**
 * フレーズ保存アクション (Server Action)
 */
export async function savePhraseAction(
  lang: string,
  data: PhraseFormValues & { id?: string; createdAt?: string },
): Promise<{ error?: string } | void> {
  try {
    const id = (data.id as PhraseId) || (generateId() as PhraseId);

    // ドメインモデルの再構成
    const phrase = createPhrase(
      {
        id,
        slug: data.slug,
        createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
        updatedAt: new Date(),
      },
      {
        slug: data.slug,
        composerSlug: data.composerSlug,
        workSlug: data.workSlug,
        workPartSlug: data.workPartSlug,
        scoreSlug: data.scoreSlug,
        format: data.format,
        notationPath: data.notationPath,
        measureRange: data.measureRange,
        caption: data.caption,
      },
    );

    await saveUseCase.execute(phrase);

    revalidatePath(`/${lang}/admin/phrases`);
    revalidatePath(`/${lang}/admin/phrases/${id}`);
  } catch (error: unknown) {
    consola.error('[savePhraseAction] Error:', error);
    if (error instanceof AppError) {
      return { error: error.message };
    }
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: 'An unexpected error occurred during save.' };
  }

  // 保存後は一覧へ戻る
  redirect(`/${lang}/admin/phrases`);
}

/**
 * フレーズ削除アクション (Server Action)
 */
export async function deletePhraseAction(lang: string, id: PhraseId) {
  try {
    await deleteUseCase.execute(id);
    revalidatePath(`/${lang}/admin/phrases`);
  } catch (error: unknown) {
    consola.error('[deletePhraseAction] Error:', error);
    return { error: 'Failed to delete the phrase.' };
  }

  redirect(`/${lang}/admin/phrases`);
}
