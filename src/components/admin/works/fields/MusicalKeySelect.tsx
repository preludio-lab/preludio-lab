'use client';

import React from 'react';
import { MusicalKey } from '@/domain/work/musical-key';
import { MUSICAL_KEY_LABELS } from '@/domain/shared/enum-labels';
import { AdminSelect, SelectOption } from '@/components/ui/admin/AdminSelect';

const OPTIONS: SelectOption<MusicalKey>[] = (Object.keys(MUSICAL_KEY_LABELS) as MusicalKey[]).map(
  (key) => ({
    value: key,
    label: MUSICAL_KEY_LABELS[key],
  }),
);

interface MusicalKeySelectProps {
  id?: string;
  label?: string;
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
}

/**
 * MusicalKeySelect - 調性選択コンポーネント
 */
export function MusicalKeySelect({
  id,
  label = '調性 (Key)',
  value,
  onChange,
  placeholder = '調性を選択...',
  className = '',
  error,
  disabled = false,
}: MusicalKeySelectProps) {
  return (
    <AdminSelect<MusicalKey>
      id={id}
      label={label}
      // 強制的にキャストして AdminSelect に渡す (既存データ不整合警告が出るようにする)
      value={value as MusicalKey}
      options={OPTIONS}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      error={error}
      disabled={disabled}
    />
  );
}
