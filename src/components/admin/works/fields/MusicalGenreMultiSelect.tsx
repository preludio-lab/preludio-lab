'use client';

import React from 'react';
import { MUSICAL_GENRE_LABELS } from '@/domain/shared/enum-labels';
import { AdminMultiSelect, MultiSelectOption } from '@/components/ui/admin/AdminMultiSelect';

const OPTIONS: MultiSelectOption<string>[] = Object.keys(MUSICAL_GENRE_LABELS).map((key) => ({
  value: key,
  label: MUSICAL_GENRE_LABELS[key],
}));

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
  return (
    <AdminMultiSelect<string>
      id={id}
      label={label}
      values={values}
      options={OPTIONS}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      error={error}
      disabled={disabled}
    />
  );
}
