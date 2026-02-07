'use client';

import React, { useState } from 'react';

/**
 * Tabの定義
 */
export interface TabItem {
  id: string;
  label: string;
  content: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  defaultTabId?: string;
  className?: string;
}

/**
 * Tabs - 管理画面用タブコンポーネント
 */
export function Tabs({ tabs, defaultTabId, className = '' }: TabsProps) {
  const [activeTabId, setActiveTabId] = useState(defaultTabId || tabs[0]?.id);

  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex border-b border-admin-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTabId(tab.id)}
            className={`
              px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px
              ${
                activeTabId === tab.id
                  ? 'border-admin-primary text-admin-primary'
                  : 'border-transparent text-admin-text-secondary hover:text-admin-text-primary'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="pt-2">{activeTab?.content}</div>
    </div>
  );
}
