'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { WorkDetail } from '@/components/admin/works/WorkDetail';

const getMockWork = (slug: string) => {
  return {
    title: '交響曲第5番 ハ短調 作品67「運命」',
    slug: slug,
    composerName: 'Ludwig van Beethoven',
    year: '1808',
    description:
      '交響曲第5番ハ短調作品67は、ルートヴィヒ・ヴァン・ベートーヴェンの作曲した5番目の交響曲である。日本では一般に「運命」の通称で親しまれている。冒頭の4つの音の動機（「ダダダダーン」）はあまりにも有名であり、ベートーヴェン自身が「運命はこのように窓を叩く」と語ったという逸話から名付けられた。',
    status: 'published' as const,
  };
};

const MOCK_RELATED_PHRASES = [
  { id: '201', title: '冒頭の主題（第1楽章）', measureRange: '1-5', status: 'published' as const },
  { id: '202', title: '第2主題の前奏', measureRange: '59-62', status: 'published' as const },
  { id: '203', title: '展開部のホルン', measureRange: '125-130', status: 'draft' as const },
];

export default function WorkDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const work = getMockWork(slug);

  return <WorkDetail work={work} relatedPhrases={MOCK_RELATED_PHRASES} />;
}
