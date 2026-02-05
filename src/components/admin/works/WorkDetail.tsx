'use client';

import React from 'react';
import { Tabs, type TabItem } from '@/components/ui/admin/Tabs';
import { Badge } from '@/components/ui/admin/CommonIcons';

interface RelatedPhrase {
  id: string;
  title: string;
  measureRange: string;
  status: 'published' | 'draft';
}

interface WorkDetailProps {
  work: {
    title: string;
    slug: string;
    composerName: string;
    year: string;
    description: string;
    status: 'published' | 'draft';
  };
  relatedPhrases: RelatedPhrase[];
}

/**
 * WorkDetail - 作品詳細 (Presentational Component)
 */
export function WorkDetail({ work, relatedPhrases }: WorkDetailProps) {
  const tabs: TabItem[] = [
    {
      id: 'basic',
      label: '基本情報',
      content: (
        <div className="bg-admin-card-bg rounded-lg border border-admin-border p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-admin-text-secondary uppercase tracking-wider mb-2">
                作品タイトル
              </label>
              <p className="text-admin-text-primary text-xl font-bold">{work.title}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-admin-text-secondary uppercase tracking-wider mb-2">
                スラグ
              </label>
              <p className="text-admin-text-primary font-mono">{work.slug}</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-admin-text-secondary uppercase tracking-wider mb-2">
                作曲家
              </label>
              <p className="text-admin-text-primary underline decoration-admin-primary/30 cursor-pointer">
                {work.composerName}
              </p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-admin-text-secondary uppercase tracking-wider mb-2">
                制作年
              </label>
              <p className="text-admin-text-primary">{work.year}</p>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-admin-text-secondary uppercase tracking-wider mb-2">
              解説テキスト
            </label>
            <p className="text-admin-text-primary leading-relaxed whitespace-pre-wrap">
              {work.description}
            </p>
          </div>
        </div>
      ),
    },
    {
      id: 'phrases',
      label: '関連フレーズ',
      content: (
        <div className="bg-admin-card-bg rounded-lg border border-admin-border overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-admin-sidebar-bg border-b border-admin-border text-xs font-semibold text-admin-text-secondary uppercase tracking-wider">
                <th className="px-6 py-4">フレーズ名</th>
                <th className="px-6 py-4">小節範囲</th>
                <th className="px-6 py-4">ステータス</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-admin-border">
              {relatedPhrases.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-6 py-8 text-center text-admin-text-secondary italic"
                  >
                    フレーズが登録されていません
                  </td>
                </tr>
              ) : (
                relatedPhrases.map((phrase) => (
                  <tr
                    key={phrase.id}
                    className="hover:bg-admin-primary-light/30 transition-colors cursor-pointer"
                  >
                    <td className="px-6 py-4 text-sm font-medium text-admin-text-primary">
                      {phrase.title}
                    </td>
                    <td className="px-6 py-4 text-sm text-admin-text-secondary font-mono">
                      {phrase.measureRange}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={phrase.status === 'published' ? 'success' : 'warning'}>
                        {phrase.status === 'published' ? '公開' : '下書き'}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <div className="p-4 bg-admin-sidebar-bg border-t border-admin-border text-center">
            <button className="text-sm font-medium text-admin-primary hover:underline">
              + 新規フレーズを追加
            </button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <nav className="text-xs text-admin-text-secondary mb-2">
            管理画面 / 作品管理 / <span className="text-admin-primary">{work.title}</span>
          </nav>
          <h1 className="text-2xl font-bold text-admin-text-primary">{work.title}</h1>
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
