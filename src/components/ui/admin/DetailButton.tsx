'use client';

import React from 'react';
import { ChevronRightIcon } from './CommonIcons';

interface DetailButtonProps {
  onClick: (e: React.MouseEvent) => void;
  label?: string;
  className?: string;
}

/**
 * DetailButton - 管理画面共通の「詳細」ボタン
 */
export function DetailButton({ onClick, label = '詳細', className = '' }: DetailButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-admin-primary border border-admin-primary/60 rounded-md bg-transparent hover:bg-admin-primary-light hover:border-admin-primary transition-all active:scale-95 group ${className}`}
    >
      <span>{label}</span>
      <ChevronRightIcon className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
    </button>
  );
}
