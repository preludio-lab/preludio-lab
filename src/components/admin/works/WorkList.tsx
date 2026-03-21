'use client';

import React from 'react';
import { DataTable, type DataTableColumn } from '@/components/ui/admin/DataTable';
import { EyeIcon } from '@/components/ui/admin/CommonIcons';
import { WorkListItemDto } from '@/application/work/dto/search-works.dto';

import { useRouter } from 'next/navigation';

interface WorkListProps {
  works: WorkListItemDto[];
  onViewDetail?: (work: WorkListItemDto) => void;
}

/**
 * WorkList - 作品一覧 (Presentational Component)
 */
export function WorkList({ works, onViewDetail }: WorkListProps) {
  const router = useRouter();

  const handleViewDetail = (item: WorkListItemDto) => {
    if (onViewDetail) {
      onViewDetail(item);
    } else {
      router.push(`/admin/works/${item.slug}`);
    }
  };

  const columns: DataTableColumn<WorkListItemDto>[] = [
    {
      header: '作品タイトル',
      accessor: (item) => (
        <div className="flex flex-col">
          <span className="font-medium text-admin-text-primary">{item.localizedTitle}</span>
          <span className="text-xs text-admin-text-secondary">{item.slug}</span>
        </div>
      ),
    },
    {
      header: '作曲家',
      accessor: (item) => item.composer.name,
    },
    {
      header: '制作年',
      accessor: (item) => item.compositionYear ?? '-',
    },
    {
      header: '共通ID',
      accessor: (item) => (
        <code className="text-xs bg-admin-bg-secondary px-1 rounded">{item.id}</code>
      ),
    },
    {
      header: 'アクション',
      accessor: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleViewDetail(item);
          }}
          className="p-2 text-admin-text-secondary hover:text-admin-primary transition-colors"
        >
          <EyeIcon />
        </button>
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
