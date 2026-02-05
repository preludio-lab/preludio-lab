'use client';

import React from 'react';
import { PhraseList, type PhraseListItem } from '@/components/admin/phrases/PhraseList';
import { useRouter } from 'next/navigation';

const MOCK_PHRASES: PhraseListItem[] = [
  {
    id: '1',
    title: '冒頭の主題（第1楽章）',
    workTitle: '交響曲第5番 ハ短調 作品67「運命」',
    composerName: 'Ludwig van Beethoven',
    measureRange: '1-5',
    status: 'published',
  },
  {
    id: '2',
    title: '第1主題（第4楽章）',
    workTitle: '交響曲第9番 ニ短調 作品125「合唱付き」',
    composerName: 'Ludwig van Beethoven',
    measureRange: '1-8',
    status: 'published',
  },
  {
    id: '3',
    title: '愛の挨拶 主題',
    workTitle: '愛の挨拶 作品12',
    composerName: 'Edward Elgar',
    measureRange: '1-4',
    status: 'draft',
  },
];

export default function PhrasesManagementPage() {
  const router = useRouter();

  const handleViewDetail = (phrase: PhraseListItem) => {
    router.push(`/admin/phrases/${phrase.id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-admin-text-primary">フレーズ管理</h1>
        <p className="text-sm text-admin-text-secondary mt-1">
          楽曲内の特定のフレーズ（譜例）を抽出し、メタデータとSVGファイルを管理します。
        </p>
      </div>

      <PhraseList phrases={MOCK_PHRASES} onViewDetail={handleViewDetail} />
    </div>
  );
}
