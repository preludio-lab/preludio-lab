'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DataTable, type DataTableColumn } from '@/components/ui/admin/DataTable';
import { DetailButton } from '@/components/ui/admin/DetailButton';
import { LocalizedPhraseDto } from '@/application/score/dto/localized-phrase.dto';
import { NotationFormat } from '@/domain/score/phrase.metadata';

interface PhraseListProps {
  phrases: LocalizedPhraseDto[];
}

/**
 * 譜面データ形式のラベルとスタイル
 */
const formatConfig: Record<NotationFormat, { label: string; bg: string; text: string }> = {
  [NotationFormat.ABC]: { label: 'ABC', bg: 'bg-blue-50', text: 'text-blue-700' },
  [NotationFormat.MUSICXML]: { label: 'MusicXML', bg: 'bg-green-50', text: 'text-green-700' },
  [NotationFormat.MEI]: { label: 'MEI', bg: 'bg-indigo-50', text: 'text-indigo-700' },
};

/**
 * PhraseList - フレーズ管理一覧 (Presentational Component)
 */
export function PhraseList({ phrases }: PhraseListProps) {
  const router = useRouter();
  const params = useParams();
  const lang = (params?.lang as string) || 'ja';

  const handleRowClick = (item: LocalizedPhraseDto) => {
    router.push(`/${lang}/admin/phrases/${item.id}`);
  };

  const columns: DataTableColumn<LocalizedPhraseDto>[] = [
    {
      header: 'キャプション (ja)',
      accessor: (item) => (
        <span className="font-medium text-admin-text-primary">
          {item.caption || (
            <span className="text-admin-text-secondary opacity-50 italic">未設定</span>
          )}
        </span>
      ),
    },
    {
      header: '識別スラグ',
      accessor: (item) => (
        <span className="text-sm font-mono text-admin-text-secondary opacity-80">{item.slug}</span>
      ),
    },
    {
      header: '楽曲 / 作曲家',
      accessor: (item) => (
        <div className="flex flex-col">
          <span className="text-sm text-admin-text-primary">{item.workSlug || '-'}</span>
          <span className="text-xs text-admin-text-secondary opacity-70">
            {item.composerSlug || '-'}
          </span>
        </div>
      ),
    },
    {
      header: '形式',
      accessor: (item) => {
        const config = formatConfig[item.format];
        return (
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${config.bg} ${config.text}`}
          >
            {config.label}
          </span>
        );
      },
    },
    {
      header: '更新日',
      accessor: (item) => (
        <span className="text-sm text-admin-text-secondary">
          {new Intl.DateTimeFormat(lang === 'ja' ? 'ja-JP' : 'en-US', {
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
        <DetailButton
          onClick={(e) => {
            e.stopPropagation();
            handleRowClick(item);
          }}
        />
      ),
      className: 'text-right',
    },
  ];

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <DataTable data={phrases} columns={columns} onRowClick={handleRowClick} />

      {phrases.length === 0 && (
        <div className="py-20 text-center border border-dashed border-admin-divider rounded-lg bg-admin-surface/50 text-admin-text-secondary">
          <p className="text-sm italic">登録されているフレーズがありません。</p>
        </div>
      )}
    </div>
  );
}
