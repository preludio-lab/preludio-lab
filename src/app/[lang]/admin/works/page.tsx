'use client';

import React from 'react';
import { WorkList, type WorkListItem } from '@/components/features/admin/WorkList';
import { useRouter } from 'next/navigation';

const MOCK_WORKS: WorkListItem[] = [
  {
    id: '1',
    title: '交響曲第5番 ハ短調 作品67「運命」',
    slug: 'symphony-no-5',
    composerName: 'Ludwig van Beethoven',
    year: '1808',
    phrasesCount: 24,
    status: 'published',
  },
  {
    id: '2',
    title: '交響曲第9番 ニ短調 作品125「合唱付き」',
    slug: 'symphony-no-9',
    composerName: 'Ludwig van Beethoven',
    year: '1824',
    phrasesCount: 42,
    status: 'published',
  },
  {
    id: '3',
    title: 'ピアノ・ソナタ第14番 嬰ハ短調 作品27-2「月光」',
    slug: 'piano-sonata-no-14',
    composerName: 'Ludwig van Beethoven',
    year: '1801',
    phrasesCount: 8,
    status: 'draft',
  },
];

export default function WorksManagementPage() {
  const router = useRouter();

  const handleViewDetail = (work: WorkListItem) => {
    router.push(`/admin/works/${work.slug}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-admin-text-primary">作品管理</h1>
        <p className="text-sm text-admin-text-secondary mt-1">
          楽曲の基本情報、作曲家との紐付け、およびフレーズのリレーション管理を行います。
        </p>
      </div>

      <WorkList works={MOCK_WORKS} onViewDetail={handleViewDetail} />
    </div>
  );
}
