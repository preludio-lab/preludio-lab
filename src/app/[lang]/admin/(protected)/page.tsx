'use client';

import React from 'react';
import { clientLogger as logger } from '@/infrastructure/logging/client.logger';

export default function AdminDashboardPage() {
  logger.debug('Admin Dashboard Page Hit');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-admin-text-primary">ダッシュボード</h1>
        <p className="text-sm text-admin-text-secondary mt-1">Preludio Lab 管理画面へようこそ。</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 統計カード */}
        {[
          { label: '総登録作品数', value: '1,234', trend: '+12%' },
          { label: '公開中記事', value: '56', trend: '+4%' },
          { label: '月間PV', value: '45.2K', trend: '+28%' },
          { label: '登録ユーザー', value: '892', trend: '+5%' },
        ].map((stat, i) => (
          <div key={i} className="bg-admin-card-bg p-6 rounded-lg border border-admin-border">
            <p className="text-xs font-semibold text-admin-text-secondary uppercase tracking-wider">
              {stat.label}
            </p>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-admin-text-primary">{stat.value}</span>
              <span className="text-xs font-medium text-green-500">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* 最近のアクティビティ */}
      <div className="bg-admin-card-bg rounded-lg border border-admin-border overflow-hidden">
        <div className="px-6 py-4 border-b border-admin-border">
          <h3 className="text-sm font-semibold text-admin-text-primary">最近のアクティビティ</h3>
        </div>
        <div className="divide-y divide-admin-border">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="px-6 py-4 flex items-center gap-4 hover:bg-admin-sidebar-bg/50 transition-colors"
            >
              <div className="w-2 h-2 rounded-full bg-admin-primary" />
              <div className="flex-1">
                <p className="text-sm text-admin-text-primary">
                  <span className="font-medium">Beethoven Symphony No.5</span>{' '}
                  のメタデータが更新されました
                </p>
                <p className="text-xs text-admin-text-secondary mt-1">2時間前 • 編集者: Tetsu</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
