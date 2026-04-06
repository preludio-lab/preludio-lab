import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PhraseForm } from '@/components/admin/phrases/PhraseForm';
import { GetPhrasesUseCase } from '@/application/score/usecase/get-phrases.usecase';
import { PhraseRepositoryImpl } from '@/infrastructure/score/phrase.repository';
import { TursoPhraseDataSource } from '@/infrastructure/score/turso.phrase.ds';
import { TursoWorkDataSource } from '@/infrastructure/work/turso.work.ds';
import { TursoComposerDataSource } from '@/infrastructure/composer/turso.composer.ds';
import { TursoScoreDataSource } from '@/infrastructure/score/turso.score.ds';
import { db } from '@/infrastructure/database/turso.client';
import { Phrase, PhraseId } from '@/domain/score/phrase';
import { PhraseMetadataSchema } from '@/domain/score/phrase.metadata';
import { z } from 'zod';
import { savePhraseAction } from '../actions';

type PhraseFormValues = z.infer<typeof PhraseMetadataSchema>;

/**
 * フレーズ編集・新規作成ページ (Server Component)
 */
export default async function PhraseEditorPage({
  params,
}: {
  params: Promise<{ id: string; lang: string }>;
}) {
  const p = await params;
  const { id: idParam, lang } = p;
  const isNew = idParam === 'new';

  let initialData: Phrase | null = null;

  if (!isNew) {
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

    const useCase = new GetPhrasesUseCase(repository);

    try {
      initialData = await useCase.getById(idParam as PhraseId);
    } catch {
      return notFound();
    }
  }

  // Server Action をバインド
  const handleSubmit = async (data: PhraseFormValues): Promise<{ error?: string } | void> => {
    'use server';
    return savePhraseAction(lang, { ...data, id: isNew ? undefined : idParam });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-8">
      <div className="flex items-center gap-4">
        <Link
          href={`/${lang}/admin/phrases`}
          className="p-2 hover:bg-admin-surface rounded-full transition-colors text-admin-text-secondary"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
        </Link>
        <h1 className="text-2xl font-bold text-admin-text-primary">
          {isNew ? '新規フレーズの作成' : 'フレーズの編集'}
        </h1>
      </div>

      <PhraseForm initialData={initialData} onSubmit={handleSubmit} />
    </div>
  );
}
