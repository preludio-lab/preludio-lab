'use client';

import React from 'react';

/**
 * テーブルのカラム定義
 */
export interface DataTableColumn<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

/**
 * DataTableのProps
 */
interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
}

/**
 * DataTable - 管理画面用汎用テーブル (Presentational Component)
 */
export function DataTable<T extends { id: string | number }>({
  data,
  columns,
  onRowClick,
  isLoading,
}: DataTableProps<T>) {
  if (isLoading) {
    return (
      <div className="w-full bg-admin-card-bg rounded-lg border border-admin-border overflow-hidden animate-pulse">
        <div className="h-12 bg-admin-sidebar-bg border-b border-admin-border" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 border-b border-admin-border last:border-0" />
        ))}
      </div>
    );
  }

  return (
    <div className="w-full bg-admin-card-bg rounded-lg border border-admin-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-admin-sidebar-bg border-b border-admin-border">
              {columns.map((column, index) => (
                <th
                  key={index}
                  className={`px-6 py-4 text-xs font-semibold text-admin-text-secondary uppercase tracking-wider ${column.className || ''}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-admin-border">
            {data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-admin-text-secondary italic"
                >
                  データが見つかりませんでした
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onRowClick?.(item)}
                  className={`transition-colors ${
                    onRowClick ? 'cursor-pointer hover:bg-admin-primary-light/30' : ''
                  }`}
                >
                  {columns.map((column, index) => (
                    <td
                      key={index}
                      className={`px-6 py-4 text-sm text-admin-text-primary ${column.className || ''}`}
                    >
                      {typeof column.accessor === 'function'
                        ? column.accessor(item)
                        : (item[column.accessor] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
