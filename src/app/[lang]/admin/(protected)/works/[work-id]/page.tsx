import React from 'react';
import { WorkDetail } from '@/components/admin/works/WorkDetail';
import { TursoWorkDetailQueryService } from '@/infrastructure/work/turso.work-detail.query.service';
import { db } from '@/infrastructure/database/turso.client';
import { notFound } from 'next/navigation';

/**
 * WorkDetailPage - 作品詳細ページ (Server Component)
 * CQRS Read: IWorkDetailQueryService -> WorkDetailDto -> WorkDetail Component
 */
export default async function WorkDetailPage({
  params,
}: {
  params: Promise<{ 'work-id': string }>;
}) {
  const { 'work-id': workId } = await params;

  const queryService = new TursoWorkDetailQueryService(db);
  const work = await queryService.findById(workId);

  if (!work) {
    notFound();
  }

  return <WorkDetail work={work} />;
}
