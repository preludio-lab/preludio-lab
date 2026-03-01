'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { DataTable, type DataTableColumn } from '@/components/ui/admin/DataTable';
import { EyeIcon } from '@/components/ui/admin/CommonIcons';
import { GetComposersDto } from '@/application/composer/dto/get-composers.dto';

interface ComposerListProps {
  composers: GetComposersDto[];
}

/**
 * ComposerList - 作曲家一覧 (Presentational Component)
 */
export function ComposerList({ composers }: ComposerListProps) {
  const router = useRouter();

  const handleRowClick = (item: GetComposersDto) => {
    router.push(`/admin/composers/${item.slug}`);
  };

  const columns: DataTableColumn<GetComposersDto>[] = [
    {
      header: '名称',
      accessor: (item) => (
        <div className="flex flex-col">
          <span className="font-medium text-admin-text-primary">{item.name}</span>
          <span className="text-xs text-admin-text-secondary">{item.slug}</span>
        </div>
      ),
    },
    {
      header: '時代',
      accessor: (item) => item.era || '未設定',
    },
    {
      header: '作品数',
      accessor: (item) => <span className="text-admin-text-secondary">{item.worksCount} 作品</span>,
    },
    {
      header: 'アクション',
      accessor: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(item);
          }}
          className="p-2 text-admin-text-secondary hover:text-admin-primary transition-colors"
          title="詳細を見る"
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
        <h2 className="text-lg font-semibold text-admin-text-primary">登録作曲家</h2>
        <button className="px-4 py-2 bg-admin-primary text-white text-sm font-medium rounded-lg hover:bg-admin-primary/90 transition-colors">
          新規作成
        </button>
      </div>
      <DataTable data={composers} columns={columns} onRowClick={handleRowClick} />
    </div>
  );
}
