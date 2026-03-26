import React from 'react';
import { WorkList } from '@/components/admin/works/WorkList';
import { SearchWorksUseCase } from '@/application/work/usecase/search-works.usecase';
import { TursoWorkQueryService } from '@/infrastructure/work/turso.work.query.service';
import { db } from '@/infrastructure/database/turso.client';

export default async function WorksManagementPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { lang } = await params;
  const sParams = await searchParams;

  // 1. Setup DI (Pure CQRS: Read handled by QueryService)
  const queryService = new TursoWorkQueryService(db);
  const useCase = new SearchWorksUseCase(queryService);

  // 2. Fetch Data
  const page = Number(sParams.page) || 1;
  const limit = 20;
  const offset = (page - 1) * limit;

  const response = await useCase.execute({
    lang: lang,
    sort: { field: 'createdAt', direction: 'desc' }, // Mandatory sort
    pagination: { limit, offset },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-admin-text-primary">作品管理</h1>
        <p className="text-sm text-admin-text-secondary mt-1">
          楽曲の基本情報、作曲家との紐付け、およびフレーズのリレーション管理を行います。
        </p>
      </div>

      <WorkList works={response.items} />
    </div>
  );
}
