'use client';

import React from 'react';
import { MusicalEra } from '@/domain/shared/musical-era';
import { MUSICAL_ERA_LABELS } from '@/domain/shared/enum-labels';
import { AdminSelect, SelectOption } from '@/components/ui/admin/AdminSelect';

const OPTIONS: SelectOption<MusicalEra>[] = (Object.keys(MUSICAL_ERA_LABELS) as MusicalEra[]).map(
  (key) => ({
    value: key,
    label: MUSICAL_ERA_LABELS[key],
  }),
);

interface MusicalEraSelectProps {
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
 * MusicalEraSelect - 時代選択コンポーネント
 */
export function MusicalEraSelect({
  id,
  label = '時代 (Era)',
  value,
  onChange,
  placeholder = '時代を選択...',
  className = '',
  error,
  disabled = false,
}: MusicalEraSelectProps) {
  return (
    <AdminSelect<MusicalEra>
      id={id}
      label={label}
      value={value as MusicalEra}
      options={OPTIONS}
      onChange={onChange}
      placeholder={placeholder}
      className={className}
      error={error}
      disabled={disabled}
    />
  );
}
