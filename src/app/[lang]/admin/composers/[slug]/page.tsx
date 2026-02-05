'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { ComposerDetail } from '@/components/features/admin/ComposerDetail';

/**
 * MOCK DATA FETCHING (将来は UseCase 経由)
 */
const getMockComposer = (slug: string) => {
  return {
    name: slug === 'beethoven' ? 'Ludwig van Beethoven' : 'Wolfgang Amadeus Mozart',
    slug: slug,
    description:
      '18世紀末から19世紀初頭にかけて活躍したドイツの作曲家、ピアニスト。古典派音楽の集大成であり、ロマン派音楽の先駆者とされる。その卓越した芸術性は、後の西洋音楽の発展に決定的な影響を与えた。',
    era: 'Classical/Romantic',
    status: 'published' as const,
  };
};

const MOCK_RELATED_WORKS = [
  {
    id: '101',
    title: '交響曲第5番 ハ短調 作品67「運命」',
    year: '1808',
    status: 'published' as const,
  },
  {
    id: '102',
    title: '交響曲第9番 ニ短調 作品125「合唱付き」',
    year: '1824',
    status: 'published' as const,
  },
  {
    id: '103',
    title: 'ピアノ・ソナタ第14番 嬰ハ短調 作品27-2「月光」',
    year: '1801',
    status: 'published' as const,
  },
];

/**
 * ComposerDetailPage - 作曲家詳細ページ (Container Component)
 */
export default function ComposerDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  // 実装上はここでデータをフェッチする
  const composer = getMockComposer(slug);

  return <ComposerDetail composer={composer} relatedWorks={MOCK_RELATED_WORKS} />;
}
