// Removed 'use client' to make it a Server Component

import React from 'react';
import { ComposerList } from '@/components/admin/composers/ComposerList';
import { GetComposersUseCase } from '@/application/composer/usecase/get-composers.usecase';
import { ComposerRepositoryImpl } from '@/infrastructure/composer/composer.repository';
import { TursoComposerDataSource } from '@/infrastructure/composer/turso.composer.ds';
import { db } from '@/infrastructure/database/turso.client';

/**
 * ComposersManagementPage - 作曲家管理ページ (Server Component)
 */
export default async function ComposersManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp = await searchParams;
  const page = parseInt(sp.page || '1', 10);
  const limit = 20;
  const offset = (page - 1) * limit;

  // DI Setup
  const dataSource = new TursoComposerDataSource(db);
  const repository = new ComposerRepositoryImpl(dataSource);
  const useCase = new GetComposersUseCase(repository);

  // Data Fetching
  const result = await useCase.execute({ limit, offset });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-admin-text-primary">作曲家管理</h1>
        <p className="text-sm text-admin-text-secondary mt-1">
          マスターデータの作成、編集、およびリレーションの管理を行います。
        </p>
      </div>

      <ComposerList composers={result.composers} />

      {/* ページネーション UI はここに追加 */}
      <div className="flex justify-between items-center text-sm text-admin-text-secondary">
        <span>
          全 {result.totalCount} 件中 {offset + 1} - {Math.min(offset + limit, result.totalCount)}{' '}
          件を表示
        </span>
        <div className="flex gap-2">
          {page > 1 && (
            <a
              href={`/admin/composers?page=${page - 1}`}
              className="px-3 py-1 bg-admin-surface rounded-md border border-admin-divider"
            >
              前へ
            </a>
          )}
          {offset + limit < result.totalCount && (
            <a
              href={`/admin/composers?page=${page + 1}`}
              className="px-3 py-1 bg-admin-surface rounded-md border border-admin-divider"
            >
              次へ
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
