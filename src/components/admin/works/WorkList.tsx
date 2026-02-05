'use client';

import React from 'react';
import { DataTable, type DataTableColumn } from '@/components/ui/admin/DataTable';
import { Badge, EyeIcon } from '@/components/ui/admin/CommonIcons';

export interface WorkListItem {
  id: string;
  title: string;
  slug: string;
  composerName: string;
  year: string;
  phrasesCount: number;
  status: 'published' | 'draft';
}

interface WorkListProps {
  works: WorkListItem[];
  onViewDetail: (work: WorkListItem) => void;
}

/**
 * WorkList - 作品一覧 (Presentational Component)
 */
export function WorkList({ works, onViewDetail }: WorkListProps) {
  const columns: DataTableColumn<WorkListItem>[] = [
    {
      header: '作品タイトル',
      accessor: (item) => (
        <div className="flex flex-col">
          <span className="font-medium text-admin-text-primary">{item.title}</span>
          <span className="text-xs text-admin-text-secondary">{item.slug}</span>
        </div>
      ),
    },
    {
      header: '作曲家',
      accessor: 'composerName',
    },
    {
      header: '制作年',
      accessor: 'year',
    },
    {
      header: 'フレーズ数',
      accessor: (item) => <span className="text-admin-text-secondary">{item.phrasesCount}</span>,
    },
    {
      header: 'ステータス',
      accessor: (item) => (
        <Badge variant={item.status === 'published' ? 'success' : 'warning'}>
          {item.status === 'published' ? '公開' : '下書き'}
        </Badge>
      ),
    },
    {
      header: 'アクション',
      accessor: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewDetail(item);
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
      <DataTable data={works} columns={columns} onRowClick={onViewDetail} />
    </div>
  );
}
