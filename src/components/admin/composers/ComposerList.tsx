'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DataTable, type DataTableColumn } from '@/components/ui/admin/DataTable';
import { ChevronRightIcon } from '@/components/ui/admin/CommonIcons';
import { GetComposersDto } from '@/application/composer/dto/get-composers.dto';

interface ComposerListProps {
  composers: GetComposersDto[];
}

/**
 * ComposerList - 作曲家一覧 (Presentational Component)
 */
export function ComposerList({ composers }: ComposerListProps) {
  const router = useRouter();
  const params = useParams();
  const lang = (params?.lang as string) || 'ja';

  const handleRowClick = (item: GetComposersDto) => {
    router.push(`/${lang}/admin/composers/${item.slug}`);
  };

  const columns: DataTableColumn<GetComposersDto>[] = [
    {
      header: '画像',
      accessor: (item) => (
        <div className="flex items-center">
          {item.portrait ? (
            <img
              src={item.portrait}
              alt={item.name}
              className="w-10 h-10 rounded-full object-cover bg-admin-surface border border-admin-divider"
            />
          ) : (
            <div className="w-10 h-10 rounded-full bg-admin-surface border border-admin-divider flex items-center justify-center text-admin-text-secondary">
              <span className="text-xs">{item.name.charAt(0)}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      header: '名前',
      accessor: (item) => <span className="font-medium text-admin-text-primary">{item.name}</span>,
    },
    {
      header: 'Slug',
      accessor: (item) => (
        <span className="text-sm text-admin-text-secondary opacity-70">{item.slug}</span>
      ),
    },
    {
      header: '時代',
      accessor: (item) => (
        <span className="text-sm text-admin-text-primary">{item.era || '未設定'}</span>
      ),
    },
    {
      header: '国籍',
      accessor: (item) => (
        <span className="text-sm text-admin-text-secondary">{item.nationalityCode || '-'}</span>
      ),
    },
    {
      header: '最終更新',
      accessor: (item) => (
        <span className="text-sm text-admin-text-secondary">
          {new Intl.DateTimeFormat(lang === 'ja' ? 'ja-JP' : 'en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }).format(new Date(item.updatedAt))}
        </span>
      ),
    },
    {
      header: '',
      accessor: (item) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(item);
          }}
          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-admin-primary border border-admin-primary/60 rounded-md bg-transparent hover:bg-admin-primary-light hover:border-admin-primary transition-all active:scale-95 group"
        >
          <span>詳細</span>
          <ChevronRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
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
