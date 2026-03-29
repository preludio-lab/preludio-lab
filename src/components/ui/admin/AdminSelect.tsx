'use client';

import React from 'react';

export interface SelectOption<T extends string> {
  value: T;
  label: string;
}

interface AdminSelectProps<T extends string> {
  id?: string;
  label?: string;
  value: T | '' | null;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
}

/**
 * AdminSelect - 型安全な管理者向けセレクトボックス
 */
export function AdminSelect<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
  placeholder = '選択してください...',
  className = '',
  error,
  disabled = false,
}: AdminSelectProps<T>) {
  // 既存データが Enum に存在しない場合のチェック
  const isValueValid = value === '' || value === null || options.some((opt) => opt.value === value);

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          className="block text-xs font-bold text-admin-text-secondary uppercase mb-0.5"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <select
          id={id}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value as T)}
          disabled={disabled}
          className={`
            w-full bg-admin-sidebar-bg border rounded-md px-3 py-2 text-admin-text-primary 
            focus:outline-none focus:ring-1 focus:ring-admin-primary sm:text-sm appearance-none
            disabled:opacity-50 disabled:cursor-not-allowed
            ${error ? 'border-red-500' : 'border-admin-border'}
            ${!isValueValid ? 'border-amber-500' : ''}
          `}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {!isValueValid && value && (
            <option value={value} className="text-amber-500">
              {value} (不明な値)
            </option>
          )}
        </select>
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none text-admin-text-secondary">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>
      {!isValueValid && value && (
        <p className="text-[10px] text-amber-500 font-medium">
          警告: 現在の値 &quot;{value}&quot; は定義された選択肢に含まれていません。
        </p>
      )}
      {error && <p className="text-[10px] text-red-500 font-medium">{error}</p>}
    </div>
  );
}
