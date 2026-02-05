'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { PhraseEditor } from '@/components/features/admin/PhraseEditor';

const getMockPhrase = (id: string) => {
  return {
    id: id,
    title: '冒頭の主題（第1楽章）',
    workTitle: '交響曲第5番 ハ短調 作品67「運命」',
    composerName: 'Ludwig van Beethoven',
    measureRange: '1-5',
    svgUrl: '/mock/score.svg',
    status: 'published' as const,
  };
};

export default function PhraseDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const phrase = getMockPhrase(id);

  return <PhraseEditor phrase={phrase} />;
}
