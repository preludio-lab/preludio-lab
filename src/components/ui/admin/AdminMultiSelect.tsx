'use client';

import React, { useState, useRef, useEffect } from 'react';

export interface MultiSelectOption<T extends string> {
  value: T;
  label: string;
}

interface AdminMultiSelectProps<T extends string> {
  id?: string;
  label?: string;
  values: T[];
  options: MultiSelectOption<T>[];
  onChange: (values: T[]) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
}

/**
 * AdminMultiSelect - 型安全な多機能マルチセレクトコンポーネント (タグ形式 + 検索)
 */
export function AdminMultiSelect<T extends string>({
  id,
  label,
  values,
  options,
  onChange,
  placeholder = '選択してください...',
  className = '',
  error,
  disabled = false,
}: AdminMultiSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(
    (opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase()) ||
      opt.value.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleOption = (value: T) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      onChange([...values, value]);
    }
  };

  const removeValue = (value: T) => {
    onChange(values.filter((v) => v !== value));
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-admin-text-secondary uppercase mb-0.5">
          {label}
        </label>
      )}

      <div
        className={`
          relative w-full min-h-[42px] bg-admin-sidebar-bg border rounded-lg px-2 py-1.5 
          flex flex-wrap gap-1.5 cursor-pointer transition-colors
          ${isOpen ? 'ring-1 ring-admin-primary border-admin-primary' : 'border-admin-border'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-admin-primary/50'}
          ${error ? 'border-red-500' : ''}
        `}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        id={id}
      >
        {values.length === 0 && !isOpen && (
          <span className="text-sm text-admin-text-secondary ml-1 mt-0.5">{placeholder}</span>
        )}

        {values.map((v) => {
          const opt = options.find((o) => o.value === v);
          return (
            <span
              key={v}
              className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium bg-admin-primary text-white"
            >
              {opt ? opt.label : v}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeValue(v);
                }}
                className="hover:text-black/50 transition-colors"
                disabled={disabled}
              >
                ×
              </button>
            </span>
          );
        })}

        {isOpen && (
          <input
            autoFocus
            type="text"
            className="flex-1 bg-transparent border-none outline-none text-sm text-admin-text-primary p-0 min-w-[50px]"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClick={(e) => e.stopPropagation()}
            placeholder="検索..."
          />
        )}

        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-admin-text-secondary pointer-events-none">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </div>

      {isOpen && (
        <div className="relative">
          <div className="absolute z-50 w-full mt-1 bg-admin-card-bg border border-admin-border rounded-lg shadow-xl max-h-60 overflow-y-auto scrollbar-thin">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-admin-text-secondary italic">
                見つかりませんでした
              </div>
            ) : (
              <div className="py-1">
                {filteredOptions.map((opt) => {
                  const isSelected = values.includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={`
                        w-full text-left px-4 py-2 text-sm transition-colors flex items-center justify-between
                        ${
                          isSelected
                            ? 'bg-admin-primary/10 text-admin-primary font-medium'
                            : 'text-admin-text-primary hover:bg-admin-sidebar-bg'
                        }
                      `}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleOption(opt.value);
                      }}
                    >
                      <span>{opt.label}</span>
                      {isSelected && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                          className="w-4 h-4"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-[10px] text-red-500 font-medium px-1">{error}</p>}
    </div>
  );
}
