import React from 'react';
import { ComposerDetail } from '@/components/admin/composers/ComposerDetail';
import { GetComposerByIdUseCase } from '@/application/composer/usecase/get-composer-by-id.usecase';
import { ComposerRepositoryImpl } from '@/infrastructure/composer/composer.repository';
import { TursoComposerDataSource } from '@/infrastructure/composer/turso.composer.ds';
import { db } from '@/infrastructure/database/turso.client';
import { notFound } from 'next/navigation';

const MOCK_RELATED_WORKS = [
  {
    id: '101',
    title: '交響曲第5番 ハ短調 作品67「運命」',
    year: 1808,
  },
  {
    id: '102',
    title: '交響曲第9番 ニ短調 作品125「合唱付き」',
    year: 1824,
  },
];

/**
 * ComposerDetailPage - 作曲家詳細ページ (Server Component)
 */
export default async function ComposerDetailPage({
  params,
}: {
  params: Promise<{ 'composer-id': string }>;
}) {
  const { 'composer-id': composerId } = await params;

  try {
    const dataSource = new TursoComposerDataSource(db);
    const repository = new ComposerRepositoryImpl(dataSource);
    const useCase = new GetComposerByIdUseCase(repository);

    const composer = await useCase.execute(composerId);

    return (
      <ComposerDetail
        composer={composer}
        relatedWorks={composer.relatedWorks.length > 0 ? composer.relatedWorks : MOCK_RELATED_WORKS}
      />
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    if (error.code === 'NOT_FOUND') {
      notFound();
    }
    throw error;
  }
}
