'use client';

import React from 'react';
import { Tabs, type TabItem } from '@/components/ui/admin/Tabs';
import { Badge } from '@/components/ui/admin/CommonIcons';

interface RelatedWork {
  id: string;
  title: string;
  year: string;
  status: 'published' | 'draft';
}

interface ComposerDetailProps {
  composer: {
    name: string;
    slug: string;
    description: string;
    era: string;
    status: 'published' | 'draft';
  };
  relatedWorks: RelatedWork[];
}

/**
 * ComposerDetail - 作曲家詳細 (Presentational Component)
 */
export function ComposerDetail({ composer, relatedWorks }: ComposerDetailProps) {
  const tabs: TabItem[] = [
    {
      id: 'basic',
      label: '基本情報',
      content: (
        <div className="bg-admin-card-bg rounded-lg border border-admin-border p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-admin-text-secondary uppercase tracking-wider mb-2">
                作曲家名
              </label>
              <p className="text-admin-text-primary text-lg font-medium">{composer.name}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-admin-text-secondary uppercase tracking-wider mb-2">
                スラグ
              </label>
              <p className="text-admin-text-primary font-mono">{composer.slug}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-admin-text-secondary uppercase tracking-wider mb-2">
                時代
              </label>
              <p className="text-admin-text-primary">{composer.era}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-admin-text-secondary uppercase tracking-wider mb-2">
                ステータス
              </label>
              <Badge variant={composer.status === 'published' ? 'success' : 'warning'}>
                {composer.status === 'published' ? '公開中' : '下書き'}
              </Badge>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-admin-text-secondary uppercase tracking-wider mb-2">
              説明
            </label>
            <p className="text-admin-text-primary leading-relaxed whitespace-pre-wrap">
              {composer.description}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'works',
      label: '関連作品',
      content: (
        <div className="bg-admin-card-bg rounded-lg border border-admin-border overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-admin-sidebar-bg border-b border-admin-border text-xs font-semibold text-admin-text-secondary uppercase tracking-wider">
                <th className="px-6 py-4">作品名</th>
                <th className="px-6 py-4">制作年</th>
                <th className="px-6 py-4">ステータス</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border font-medium">
              {relatedWorks.map((work) => (
                <tr key={work.id} className="hover:bg-admin-primary-light/30 transition-colors">
                  <td className="px-6 py-4 text-sm text-admin-text-primary">{work.title}</td>
                  <td className="px-6 py-4 text-sm text-admin-text-secondary">{work.year}</td>
                  <td className="px-6 py-4">
                    <Badge variant={work.status === 'published' ? 'success' : 'warning'}>
                      {work.status === 'published' ? '公開' : '下書き'}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <nav className="text-xs text-admin-text-secondary mb-2">
            管理画面 / 作曲家管理 / <span className="text-admin-primary">{composer.name}</span>
          </nav>
          <h1 className="text-2xl font-bold text-admin-text-primary">{composer.name}</h1>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 border border-admin-border text-admin-text-primary text-sm font-medium rounded-lg hover:bg-admin-sidebar-bg transition-colors">
            編集
          </button>
          <button className="px-4 py-2 bg-admin-primary text-white text-sm font-medium rounded-lg hover:bg-admin-primary/90 transition-colors">
            変更を保存
          </button>
        </div>
      </div>

      <Tabs tabs={tabs} />
    </div>
  );
}
