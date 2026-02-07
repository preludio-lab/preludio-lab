'use client';

import React from 'react';
import { DataTable, type DataTableColumn } from '@/components/ui/admin/DataTable';
import { Badge, EyeIcon } from '@/components/ui/admin/CommonIcons';

/**
 * 作曲家データの定義
 */
export interface ComposerListItem {
  id: string;
  name: string;
  slug: string;
  era: string;
  worksCount: number;
  status: 'published' | 'draft';
}

interface ComposerListProps {
  composers: ComposerListItem[];
  onViewDetail: (composer: ComposerListItem) => void;
}

/**
 * ComposerList - 作曲家一覧 (Presentational Component)
 */
export function ComposerList({ composers, onViewDetail }: ComposerListProps) {
  const columns: DataTableColumn<ComposerListItem>[] = [
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
      accessor: 'era',
    },
    {
      header: '作品数',
      accessor: (item) => <span className="text-admin-text-secondary">{item.worksCount} 作品</span>,
    },
    {
      header: 'ステータス',
      accessor: (item) => (
        <Badge variant={item.status === 'published' ? 'success' : 'warning'}>
          {item.status === 'published' ? '公開中' : '下書き'}
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
      <DataTable data={composers} columns={columns} onRowClick={onViewDetail} />
    </div>
  );
}
