'use client';

import React from 'react';
import { getMusicalGenreLabel, MUSICAL_GENRE_LABELS } from '@/domain/shared/enum-labels';
import { AdminMultiSelect, MultiSelectOption } from '@/components/ui/admin/AdminMultiSelect';
import { useLocale } from 'next-intl';
import { AppLocale } from '@/domain/i18n/locale';

interface MusicalGenreMultiSelectProps {
  id?: string;
  label?: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
}

/**
 * MusicalGenreMultiSelect - ジャンルマルチセレクト
 */
export function MusicalGenreMultiSelect({
  id,
  label = 'ジャンル (Genre)',
  values,
  onChange,
  placeholder = 'ジャンルを選択...',
  className = '',
  error,
  disabled = false,
}: MusicalGenreMultiSelectProps) {
  const locale = useLocale() as AppLocale;

  // ラベルを多言語設定
  const options: MultiSelectOption<string>[] = Object.keys(MUSICAL_GENRE_LABELS).map((key) => ({
    value: key,
    label: getMusicalGenreLabel(key, locale),
  }));

  return (
    <AdminMultiSelect<string>
      id={id}
      label={label}
      values={values}
      options={options}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      error={error}
      disabled={disabled}
    />
  );
}
