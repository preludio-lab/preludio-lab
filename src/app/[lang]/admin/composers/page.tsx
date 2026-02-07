'use client';

import React from 'react';
import { ComposerList, type ComposerListItem } from '@/components/admin/composers/ComposerList';
import { useRouter } from 'next/navigation';

/**
 * MOCK DATA
 */
const MOCK_COMPOSERS: ComposerListItem[] = [
  {
    id: '1',
    name: 'Ludwig van Beethoven',
    slug: 'beethoven',
    era: 'Classical/Romantic',
    worksCount: 12,
    status: 'published',
  },
  {
    id: '2',
    name: 'Wolfgang Amadeus Mozart',
    slug: 'mozart',
    era: 'Classical',
    worksCount: 8,
    status: 'published',
  },
  {
    id: '3',
    name: 'Johannes Brahms',
    slug: 'brahms',
    era: 'Romantic',
    worksCount: 5,
    status: 'draft',
  },
  {
    id: '4',
    name: 'Johann Sebastian Bach',
    slug: 'bach',
    era: 'Baroque',
    worksCount: 15,
    status: 'published',
  },
];

/**
 * ComposersManagementPage - 作曲家管理ページ (Container Component)
 */
export default function ComposersManagementPage() {
  const router = useRouter();

  const handleViewDetail = (composer: ComposerListItem) => {
    router.push(`/admin/composers/${composer.slug}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-admin-text-primary">作曲家管理</h1>
        <p className="text-sm text-admin-text-secondary mt-1">
          マスターデータの作成、編集、およびリレーションの管理を行います。
        </p>
      </div>

      <ComposerList composers={MOCK_COMPOSERS} onViewDetail={handleViewDetail} />
    </div>
  );
}
