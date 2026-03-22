'use client';

import React from 'react';
import { DataTable, type DataTableColumn } from '@/components/ui/admin/DataTable';
import { Badge } from '@/components/ui/admin/CommonIcons';
import { DetailButton } from '@/components/ui/admin/DetailButton';

export interface PhraseListItem {
  id: string;
  title: string;
  workTitle: string;
  composerName: string;
  measureRange: string;
  status: 'published' | 'draft';
}

interface PhraseListProps {
  phrases: PhraseListItem[];
  onViewDetail: (phrase: PhraseListItem) => void;
}

/**
 * PhraseList - フレーズ一覧 (Presentational Component)
 */
export function PhraseList({ phrases, onViewDetail }: PhraseListProps) {
  const columns: DataTableColumn<PhraseListItem>[] = [
    {
      header: 'フレーズ名',
      accessor: (item) => <span className="font-medium text-admin-text-primary">{item.title}</span>,
    },
    {
      header: '作品 / 作曲家',
      accessor: (item) => (
        <div className="flex flex-col">
          <span className="text-sm text-admin-text-primary">{item.workTitle}</span>
          <span className="text-xs text-admin-text-secondary">{item.composerName}</span>
        </div>
      ),
    },
    {
      header: '小節範囲',
      accessor: (item) => (
        <span className="font-mono text-sm text-admin-text-secondary">{item.measureRange}</span>
      ),
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
        <DetailButton
          onClick={(e) => {
            e.stopPropagation();
            onViewDetail(item);
          }}
        />
      ),
      className: 'text-right',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-admin-text-primary">登録フレーズ（譜例）</h2>
        <button className="px-4 py-2 bg-admin-primary text-white text-sm font-medium rounded-lg hover:bg-admin-primary/90 transition-colors">
          新規フレーズ追加
        </button>
      </div>
      <DataTable data={phrases} columns={columns} onRowClick={onViewDetail} />
    </div>
  );
}
