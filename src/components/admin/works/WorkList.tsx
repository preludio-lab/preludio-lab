'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DataTable, type DataTableColumn } from '@/components/ui/admin/DataTable';
import { DetailButton } from '@/components/ui/admin/DetailButton';
import { WorkListItemDto } from '@/application/work/dto/search-works.dto';

interface WorkListProps {
  works: WorkListItemDto[];
  onViewDetail?: (work: WorkListItemDto) => void;
}

/**
 * WorkList - 作品一覧 (Presentational Component)
 */
export function WorkList({ works, onViewDetail }: WorkListProps) {
  const router = useRouter();
  const params = useParams();
  const lang = (params?.lang as string) || 'ja';

  const handleViewDetail = (item: WorkListItemDto) => {
    if (onViewDetail) {
      onViewDetail(item);
    } else {
      router.push(`/${lang}/admin/works/${item.slug}`);
    }
  };

  const columns: DataTableColumn<WorkListItemDto>[] = [
    {
      header: '作曲家',
      accessor: (item) => item.composer.name,
    },
    {
      header: '作品タイトル',
      accessor: (item) => (
        <span className="font-medium text-admin-text-primary">{item.localizedTitle}</span>
      ),
    },
    {
      header: 'スラッグ',
      accessor: (item) => <span className="text-xs text-admin-text-secondary">{item.slug}</span>,
    },
    {
      header: '作品番号',
      accessor: (item) => (
        <span className="text-sm font-mono">
          {item.cataloguePrefix && item.catalogueNumber
            ? `${item.cataloguePrefix}${item.catalogueNumber}`
            : item.catalogueNumber || item.cataloguePrefix || '-'}
        </span>
      ),
    },
    {
      header: 'ジャンル',
      accessor: (item) => (
        <div className="flex flex-wrap gap-1">
          {item.genres.length > 0
            ? item.genres.map((g: string) => (
                <span key={g} className="text-xs bg-admin-bg-secondary px-1.5 py-0.5 rounded">
                  {g}
                </span>
              ))
            : '-'}
        </div>
      ),
    },
    {
      header: '制作年',
      accessor: (item) => item.compositionYear ?? '-',
    },
    {
      header: '',
      accessor: (item) => (
        <DetailButton
          onClick={(e) => {
            e.stopPropagation();
            handleViewDetail(item);
          }}
        />
      ),
      className: 'text-right',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-admin-text-primary">登録作品</h2>
        <button className="px-4 py-2 bg-admin-primary text-white text-sm font-medium rounded-lg hover:bg-admin-primary/90 transition-colors">
          新規作品追加
        </button>
      </div>
      <DataTable data={works} columns={columns} onRowClick={handleViewDetail} />
    </div>
  );
}
